"use server";

import { requireUser } from "@/lib/auth";
import {
  BALANCE_ADJUSTMENT_SOURCE,
  getBalanceAdjustmentCategoryColor,
  getBalanceAdjustmentCategoryName,
  getBalanceAdjustmentValidationError,
  resolveBalanceAdjustment
} from "@/lib/balance-adjustments";
import { invalidateAiInsightCache, invalidateWalletReadCaches } from "@/lib/data/cache";
import { consumeTransactionRateLimit } from "@/lib/rate-limit";
import {
  errorResult,
  getActionLocale,
  getActionTimezone,
  getActionTranslator,
  getWalletMemberUserIds,
  getNullableText,
  getNumericValue,
  getStringValue,
  getTrimmedValue,
  revalidateWalletPaths,
  safeDbError,
  successResult,
  type ActionResult
} from "@/app/actions/_shared";
import { combineDateAndTime, dateStringToISO, isValidDateString } from "@/lib/utils";
import { parseNumberInput } from "@/lib/finance";

function readTransactionForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    transactionId: getStringValue(formData, "transaction_id"),
    kind: getStringValue(formData, "kind") || "expense",
    categoryId: getStringValue(formData, "category_id"),
    note: getNullableText(formData, "note"),
    amount: getNumericValue(formData, "amount"),
    happenedAt: getStringValue(formData, "happened_at"),
    happenedAtTime: getStringValue(formData, "happened_at_time")
  };
}

function readBalanceAdjustmentForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    actualBalance: getNumericValue(formData, "actual_balance"),
    note: getTrimmedValue(formData, "note"),
    happenedAt: getStringValue(formData, "happened_at"),
    happenedAtTime: getStringValue(formData, "happened_at_time")
  };
}

function mapTransactionError(error: unknown, linkedSavingTransactionMessage: string, t: (key: string, values?: Record<string, string | number>) => string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: string }).message;
    if (message.includes("saving_transaction_managed_by_entries")) {
      return linkedSavingTransactionMessage;
    }
  }

  return safeDbError(error, "actionErrors.unexpectedError", t);
}

async function getTransactionLinkState(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string,
  transactionId: string
) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, saving_entry_id, source")
    .eq("id", transactionId)
    .eq("wallet_id", walletId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function ensureBalanceAdjustmentCategory(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string,
  kind: "income" | "expense",
  userId: string
) {
  const { data, error } = await supabase.rpc("ensure_balance_adjustment_category", {
    target_wallet_id: walletId,
    target_kind: kind
  });

  if (!error && data) {
    return data as string;
  }

  // Keep balance adjustments usable when the RPC signature/schema cache lags behind deployed app code.
  const categoryName = getBalanceAdjustmentCategoryName(kind);
  const categoryColor = getBalanceAdjustmentCategoryColor(kind);

  const loadExistingCategory = async () => {
    const { data: category } = await supabase
      .from("categories")
      .select("id, is_system")
      .eq("wallet_id", walletId)
      .eq("kind", kind)
      .eq("name", categoryName)
      .maybeSingle();

    return category as { id: string; is_system: boolean } | null;
  };

  const existingCategory = await loadExistingCategory();

  if (existingCategory) {
    if (!existingCategory.is_system) {
      void supabase
        .from("categories")
        .update({
          is_system: true,
          color: categoryColor,
          updated_by: userId
        })
        .eq("id", existingCategory.id)
        .eq("wallet_id", walletId);
    }

    return existingCategory.id;
  }

  const { data: insertedCategory, error: insertError } = await supabase
    .from("categories")
    .insert({
      wallet_id: walletId,
      name: categoryName,
      kind,
      color: categoryColor,
      is_system: true,
      created_by: userId,
      updated_by: userId
    })
    .select("id")
    .single();

  if (!insertError && insertedCategory?.id) {
    return insertedCategory.id as string;
  }

  if (insertError && typeof insertError === "object" && "code" in insertError && insertError.code === "23505") {
    return (await loadExistingCategory())?.id ?? null;
  }

  return null;
}

async function getWalletWriteRole(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("wallet_members")
    .select("role")
    .eq("wallet_id", walletId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.role as "owner" | "editor" | "viewer";
}

async function getWalletAvailableBalance(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string
) {
  const { data, error } = await supabase.rpc("get_wallet_balances", { wallet_ids: [walletId] });

  if (error) {
    return null;
  }

  return Number(data?.[0]?.available_balance ?? 0);
}

export async function createTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, kind, categoryId, note, amount, happenedAt, happenedAtTime } = readTransactionForm(formData);
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  if (!happenedAt || !isValidDateString(happenedAt)) {
    return errorResult(t("actionErrors.transactionDateInvalid"));
  }

  if (!amount || amount <= 0) {
    return errorResult(t("actionErrors.transactionAmountInvalid"));
  }

  const rateLimit = await consumeTransactionRateLimit(user.id);

  if (!rateLimit.allowed) {
    return errorResult(t("actionErrors.transactionRateLimited"));
  }

  const timezone = await getActionTimezone();
  const happenedAtISO = dateStringToISO(combineDateAndTime(happenedAt, happenedAtTime || null, timezone));

  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: categoryId || null,
    kind,
    amount,
    note,
    happened_at: happenedAtISO,
    source: "manual",
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    return errorResult(mapTransactionError(error, t("actionStatus.linkedSavingTransaction"), t));
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "transactions", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions"]
  });
  return successResult(t("actionSuccess.transactionSaved"), { resetForm: true });
}

export async function createBalanceAdjustment(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, actualBalance, note, happenedAt, happenedAtTime } = readBalanceAdjustmentForm(formData);
  const { supabase, user } = await requireUser();
  const locale = await getActionLocale();
  const t = await getActionTranslator();
  const validationError = getBalanceAdjustmentValidationError({
    actualBalance,
    happenedAt,
    note,
    isValidDate: isValidDateString(happenedAt)
  }, locale);

  if (validationError) {
    return errorResult(validationError);
  }

  const rateLimit = await consumeTransactionRateLimit(user.id);

  if (!rateLimit.allowed) {
    return errorResult(t("actionErrors.transactionRateLimited"));
  }

  const role = await getWalletWriteRole(supabase, walletId, user.id);

  if (role !== "owner" && role !== "editor") {
    return errorResult(t("actionErrors.transactionWriteForbidden"));
  }

  const recordedBalance = await getWalletAvailableBalance(supabase, walletId);

  if (recordedBalance === null) {
    return errorResult(t("actionErrors.unexpectedError"));
  }

  const adjustment = resolveBalanceAdjustment(recordedBalance, actualBalance as number);

  if (!adjustment) {
    return errorResult(t("actionErrors.balanceAdjustmentNoChange"));
  }

  const categoryId = await ensureBalanceAdjustmentCategory(supabase, walletId, adjustment.kind, user.id);

  if (!categoryId) {
    return errorResult(t("actionErrors.balanceAdjustmentCategoryUnavailable"));
  }

  const timezone = await getActionTimezone();
  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: categoryId,
    kind: adjustment.kind,
    amount: adjustment.amount,
    note,
    happened_at: dateStringToISO(combineDateAndTime(happenedAt, happenedAtTime || null, timezone)),
    source: BALANCE_ADJUSTMENT_SOURCE,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "transactions", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets", "reports"]
  });
  return successResult(t("actionSuccess.balanceAdjustmentSaved"), { resetForm: true });
}

export async function updateTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, transactionId, kind, categoryId, note, amount, happenedAt, happenedAtTime } = readTransactionForm(formData);
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  if (!transactionId) {
    return errorResult(t("actionErrors.transactionNotFound"));
  }

  if (!happenedAt || !isValidDateString(happenedAt)) {
    return errorResult(t("actionErrors.transactionDateInvalid"));
  }

  if (!amount || amount <= 0) {
    return errorResult(t("actionErrors.transactionAmountInvalid"));
  }

  const linkedState = await getTransactionLinkState(supabase, walletId, transactionId);

  if (!linkedState) {
    return errorResult(t("actionErrors.transactionNotFound"));
  }

  if (linkedState.saving_entry_id) {
    return errorResult(t("actionStatus.linkedSavingTransaction"));
  }

  const nextCategoryId = linkedState.source === BALANCE_ADJUSTMENT_SOURCE
    ? await ensureBalanceAdjustmentCategory(supabase, walletId, kind as "income" | "expense", user.id)
    : categoryId || null;

  if (linkedState.source === BALANCE_ADJUSTMENT_SOURCE && !nextCategoryId) {
    return errorResult(t("actionErrors.balanceAdjustmentCategoryUnavailable"));
  }

  const timezone = await getActionTimezone();
  const happenedAtISO = dateStringToISO(combineDateAndTime(happenedAt, happenedAtTime || null, timezone));

  const { error } = await supabase
    .from("transactions")
    .update({
      kind,
      category_id: nextCategoryId,
      amount,
      note,
      happened_at: happenedAtISO,
      updated_by: user.id
    })
    .eq("id", transactionId)
    .eq("wallet_id", walletId);

  if (error) {
    return errorResult(mapTransactionError(error, t("actionStatus.linkedSavingTransaction"), t));
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "transactions", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets", "reports"]
  });
  return successResult(t("actionSuccess.transactionUpdated"));
}

export async function deleteTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, transactionId } = readTransactionForm(formData);
  const { supabase } = await requireUser();
  const t = await getActionTranslator();

  if (!transactionId) {
    return errorResult(t("actionErrors.transactionNotFound"));
  }

  const linkedState = await getTransactionLinkState(supabase, walletId, transactionId);

  if (!linkedState) {
    return errorResult(t("actionErrors.transactionNotFound"));
  }

  if (linkedState.saving_entry_id) {
    return errorResult(t("actionStatus.linkedSavingTransaction"));
  }

  const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("wallet_id", walletId);

  if (error) {
    return errorResult(mapTransactionError(error, t("actionStatus.linkedSavingTransaction"), t));
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "transactions", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets", "reports"]
  });
  return successResult(t("actionSuccess.transactionDeleted"));
}

export async function createBatchTransactions(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  const walletId = getStringValue(formData, "wallet_id");
  if (!walletId) {
    return errorResult("Wallet harus dipilih");
  }

  const rowCount = Number(formData.get("row_count") || 1);
  if (rowCount === 0) {
    return errorResult("Minimal harus ada 1 transaksi");
  }

  const rateLimit = await consumeTransactionRateLimit(user.id);
  if (!rateLimit.allowed) {
    return errorResult(t("actionErrors.transactionRateLimited"));
  }

  const timezone = await getActionTimezone();
  const insertRows: Record<string, unknown>[] = [];

  for (let i = 0; i < rowCount; i++) {
    const kind = (formData.get(`kind_${i}`) as string) || "expense";
    const categoryId = formData.get(`category_id_${i}`) as string;
    const note = (formData.get(`note_${i}`) as string)?.trim() || null;
    const amountStr = formData.get(`amount_${i}`) as string;
    const happenedAt = formData.get(`happened_at_${i}`) as string;
    const happenedAtTime = formData.get(`happened_at_time_${i}`) as string;

    const amount = amountStr ? parseNumberInput(amountStr) : null;

    if (!happenedAt || !isValidDateString(happenedAt)) {
      return errorResult(`Baris ke-${i + 1}: ${t("actionErrors.transactionDateInvalid")}`);
    }
    if (!amount || amount <= 0) {
      return errorResult(`Baris ke-${i + 1}: ${t("actionErrors.transactionAmountInvalid")}`);
    }

    const happenedAtISO = dateStringToISO(combineDateAndTime(happenedAt, happenedAtTime || null, timezone));

    insertRows.push({
      wallet_id: walletId,
      category_id: categoryId || null,
      kind,
      amount,
      note,
      happened_at: happenedAtISO,
      source: "manual",
      created_by: user.id,
      updated_by: user.id
    });
  }

  const { error } = await supabase.from("transactions").insert(insertRows);

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "transactions", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets"]
  });
  return successResult(t("actionSuccess.transactionSaved"), { resetForm: true });
}
