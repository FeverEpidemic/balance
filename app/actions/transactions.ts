"use server";

import { requireUser } from "@/lib/auth";
import {
  BALANCE_ADJUSTMENT_SOURCE,
  getBalanceAdjustmentKind,
  getBalanceAdjustmentValidationError
} from "@/lib/balance-adjustments";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import {
  errorResult,
  getNullableText,
  getNumericValue,
  getStringValue,
  getTrimmedValue,
  revalidateWalletPaths,
  successResult,
  type ActionResult
} from "@/app/actions/_shared";
import { dateStringToISO, isValidDateString } from "@/lib/utils";

const LINKED_SAVING_TRANSACTION_MESSAGE = "Transaksi dari saving otomatis dibuat sistem. Ubah mutasinya dari tab Saving.";

function readTransactionForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    transactionId: getStringValue(formData, "transaction_id"),
    kind: getStringValue(formData, "kind") || "expense",
    categoryId: getStringValue(formData, "category_id"),
    note: getNullableText(formData, "note"),
    amount: getNumericValue(formData, "amount"),
    happenedAt: getStringValue(formData, "happened_at")
  };
}

function readBalanceAdjustmentForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    direction: getStringValue(formData, "direction") as "increase" | "decrease",
    amount: getNumericValue(formData, "amount"),
    note: getTrimmedValue(formData, "note"),
    happenedAt: getStringValue(formData, "happened_at")
  };
}

function mapTransactionError(message: string) {
  if (message.includes("saving_transaction_managed_by_entries")) {
    return LINKED_SAVING_TRANSACTION_MESSAGE;
  }

  return message;
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
    target_kind: kind,
    actor_user_id: userId
  });

  if (error || !data) {
    return null;
  }

  return data as string;
}

export async function createTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, kind, categoryId, note, amount, happenedAt } = readTransactionForm(formData);
  const { supabase, user } = await requireUser();

  if (!happenedAt || !isValidDateString(happenedAt)) {
    return errorResult("Tanggal transaksi harus diisi dengan format yang valid.");
  }

  if (!amount || amount <= 0) {
    return errorResult("Nominal transaksi harus lebih besar dari nol.");
  }

  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: categoryId || null,
    kind,
    amount,
    note,
    happened_at: dateStringToISO(happenedAt),
    source: "manual",
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    return errorResult(mapTransactionError(error.message));
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions"]
  });
  return successResult("Transaksi berhasil disimpan.", { resetForm: true });
}

export async function createBalanceAdjustment(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, direction, amount, note, happenedAt } = readBalanceAdjustmentForm(formData);
  const { supabase, user } = await requireUser();
  const validationError = getBalanceAdjustmentValidationError({
    amount,
    happenedAt,
    note,
    isValidDate: isValidDateString(happenedAt)
  });

  if (validationError) {
    return errorResult(validationError);
  }

  const kind = getBalanceAdjustmentKind(direction);
  const categoryId = await ensureBalanceAdjustmentCategory(supabase, walletId, kind, user.id);

  if (!categoryId) {
    return errorResult("Kategori penyesuaian saldo tidak dapat disiapkan.");
  }

  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: categoryId,
    kind,
    amount,
    note,
    happened_at: dateStringToISO(happenedAt),
    source: BALANCE_ADJUSTMENT_SOURCE,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets", "reports"]
  });
  return successResult("Penyesuaian saldo berhasil disimpan.", { resetForm: true });
}

export async function updateTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, transactionId, kind, categoryId, note, amount, happenedAt } = readTransactionForm(formData);
  const { supabase, user } = await requireUser();

  if (!transactionId) {
    return errorResult("Transaksi tidak ditemukan.");
  }

  if (!happenedAt || !isValidDateString(happenedAt)) {
    return errorResult("Tanggal transaksi harus diisi dengan format yang valid.");
  }

  if (!amount || amount <= 0) {
    return errorResult("Nominal transaksi harus lebih besar dari nol.");
  }

  const linkedState = await getTransactionLinkState(supabase, walletId, transactionId);

  if (!linkedState) {
    return errorResult("Transaksi tidak ditemukan.");
  }

  if (linkedState.saving_entry_id) {
    return errorResult(LINKED_SAVING_TRANSACTION_MESSAGE);
  }

  const nextCategoryId = linkedState.source === BALANCE_ADJUSTMENT_SOURCE
    ? await ensureBalanceAdjustmentCategory(supabase, walletId, kind as "income" | "expense", user.id)
    : categoryId || null;

  if (linkedState.source === BALANCE_ADJUSTMENT_SOURCE && !nextCategoryId) {
    return errorResult("Kategori penyesuaian saldo tidak dapat disiapkan.");
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      kind,
      category_id: nextCategoryId,
      amount,
      note,
      happened_at: dateStringToISO(happenedAt),
      updated_by: user.id
    })
    .eq("id", transactionId)
    .eq("wallet_id", walletId);

  if (error) {
    return errorResult(mapTransactionError(error.message));
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets", "reports"]
  });
  return successResult("Transaksi berhasil diperbarui.");
}

export async function deleteTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, transactionId } = readTransactionForm(formData);
  const { supabase } = await requireUser();

  if (!transactionId) {
    return errorResult("Transaksi tidak ditemukan.");
  }

  const linkedState = await getTransactionLinkState(supabase, walletId, transactionId);

  if (!linkedState) {
    return errorResult("Transaksi tidak ditemukan.");
  }

  if (linkedState.saving_entry_id) {
    return errorResult(LINKED_SAVING_TRANSACTION_MESSAGE);
  }

  const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("wallet_id", walletId);

  if (error) {
    return errorResult(mapTransactionError(error.message));
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets", "reports"]
  });
  return successResult("Transaksi berhasil dihapus.");
}
