"use server";

import { requireUser } from "@/lib/auth";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import {
  errorResult,
  getActionTranslator,
  getNullableText,
  getNumericValue,
  getStringValue,
  revalidateWalletPaths,
  safeDbError,
  successResult,
  type ActionResult
} from "@/app/actions/_shared";
import { parseNumberInput } from "@/lib/finance";

export async function createDebt(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  const walletId = getStringValue(formData, "wallet_id");
  const direction = formData.get("direction") as "borrowed" | "lent" | null;
  const personName = getStringValue(formData, "person_name");
  const amount = getNumericValue(formData, "amount");
  const note = getNullableText(formData, "note");
  const dueDate = getNullableText(formData, "due_date");
  const syncWithWallet = formData.get("sync_with_wallet") === "true";

  if (!walletId || !direction || !personName) {
    return errorResult("Lengkapi semua field wajib");
  }
  if (!amount || amount <= 0) {
    return errorResult("Nominal harus lebih dari 0");
  }

  let transactionId: string | null = null;

  // Opsi: buat transaksi wallet otomatis
  if (syncWithWallet) {
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        wallet_id: walletId,
        amount,
        kind: direction === "borrowed" ? "income" : "expense",
        note: `[Utang-Piutang] ${direction === "borrowed" ? "Pinjam dari" : "Meminjamkan ke"} ${personName}${note ? `. ${note}` : ""}`,
        happened_at: new Date().toISOString(),
        source: "manual",
        created_by: user.id,
        updated_by: user.id
      })
      .select("id")
      .single();

    if (txError) {
      return errorResult("Gagal membuat transaksi penyesuaian saldo");
    }
    transactionId = tx.id;
  }

  const { error } = await supabase.from("debts").insert({
    wallet_id: walletId,
    direction,
    person_name: personName,
    amount,
    note,
    due_date: dueDate || null,
    transaction_id: transactionId,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  const dashboardUserIds = await getWalletMemberUserIdsFactory(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview"],
    dashboardUserIds
  });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    sections: ["transactions"]
  });
  return successResult("Catatan utang berhasil disimpan", { resetForm: true });
}

export async function recordDebtPayment(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  const debtId = getStringValue(formData, "debt_id");
  const walletId = getStringValue(formData, "wallet_id");
  const amount = getNumericValue(formData, "amount");
  const note = getNullableText(formData, "note");
  const syncWithWallet = formData.get("sync_with_wallet") === "true";

  if (!debtId || !amount || amount <= 0) {
    return errorResult("Nominal harus lebih dari 0");
  }

  let transactionId: string | null = null;

  if (syncWithWallet) {
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        wallet_id: walletId,
        amount,
        kind: "expense",
        note: `[Pembayaran Utang] ${note || ""}`,
        happened_at: new Date().toISOString(),
        source: "manual",
        created_by: user.id,
        updated_by: user.id
      })
      .select("id")
      .single();

    if (txError) {
      return errorResult("Gagal membuat transaksi pembayaran");
    }
    transactionId = tx.id;
  }

  const { error } = await supabase.from("debt_payments").insert({
    debt_id: debtId,
    wallet_id: walletId,
    amount,
    note,
    transaction_id: transactionId,
    created_by: user.id
  });

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    sections: ["transactions"]
  });
  return successResult("Pembayaran berhasil dicatat", { resetForm: true });
}

export async function deleteDebt(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  const debtId = getStringValue(formData, "debt_id");
  const walletId = getStringValue(formData, "wallet_id");

  const { error } = await supabase.from("debts").delete().eq("id", debtId).eq("wallet_id", walletId);

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  return successResult("Catatan utang berhasil dihapus");
}

// Helper: get wallet member user IDs (reused pattern)
async function getWalletMemberUserIdsFactory(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], walletId: string) {
  const { data } = await supabase
    .from("wallet_members")
    .select("user_id")
    .eq("wallet_id", walletId);
  return (data ?? []).map((row: { user_id: string }) => row.user_id);
}
