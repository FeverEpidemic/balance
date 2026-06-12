"use server";

import { requireUser } from "@/lib/auth";
import {
  BALANCE_ADJUSTMENT_SOURCE,
  getBalanceAdjustmentKind,
  getBalanceAdjustmentValidationError
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

function readTransactionForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    transactionId: getStringValue(formData, "transaction_id"),
    kind: getStringValue(formData, "kind") || "expense",
    categoryId: getStringValue(formData, "category_id"),
    note: getNullableText(formData, "note"),
    amount: getNumericValue(formData, "amount"),
    happenedAt: getStringValue(formData, "happened_at"),
    happenedAtTime: getStringValue(formData, "happened_at_time")
  };
}

function readBalanceAdjustmentForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    direction: getStringValue(formData, "direction") as "increase" | "decrease",
    amount: getNumericValue(formData, "amount"),
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
  kind: "income" | "expense"
) {
  const { data, error } = await supabase.rpc("ensure_balance_adjustment_category", {
    target_wallet_id: walletId,
    target_kind: kind
  });

  if (error || !data) {
    return null;
  }

  return data as string;
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
  const { walletId, direction, amount, note, happenedAt, happenedAtTime } = readBalanceAdjustmentForm(formData);
  const { supabase, user } = await requireUser();
  const locale = await getActionLocale();
  const t = await getActionTranslator();
  const validationError = getBalanceAdjustmentValidationError({
    amount,
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

  const kind = getBalanceAdjustmentKind(direction);
  const categoryId = await ensureBalanceAdjustmentCategory(supabase, walletId, kind);

  if (!categoryId) {
    return errorResult(t("actionErrors.balanceAdjustmentCategoryUnavailable"));
  }

  const timezone = await getActionTimezone();
  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: categoryId,
    kind,
    amount,
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
    ? await ensureBalanceAdjustmentCategory(supabase, walletId, kind as "income" | "expense")
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
