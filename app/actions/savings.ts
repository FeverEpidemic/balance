"use server";

import { requireUser } from "@/lib/auth";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import { dateStringToISO, isValidDateString } from "@/lib/utils";
import {
  getNullableText,
  getNumericValue,
  getStringValue,
  getTrimmedValue,
  redirectToWalletSection,
  revalidateWalletPaths
} from "@/app/actions/_shared";

function mapSavingError(message: string) {
  if (message.includes("insufficient_available_balance")) {
    return "Saldo available wallet tidak cukup untuk setor ke saving.";
  }

  if (message.includes("insufficient_saving_balance")) {
    return "Saldo saving tidak cukup untuk penarikan.";
  }

  if (message.includes("shared_saving_member_required")) {
    return "Wallet shared wajib memilih anggota kontributor saat setor.";
  }

  if (message.includes("saving_member_not_in_wallet")) {
    return "Anggota kontributor tidak terdaftar di wallet ini.";
  }

  if (message.includes("current_balance_managed_by_entries")) {
    return "Saldo saving hanya boleh berubah lewat mutasi setor atau tarik.";
  }

  if (message.includes("saving_entry_forbidden")) {
    return "Anda tidak punya izin untuk menambah mutasi saving di wallet ini.";
  }

  if (message.includes("authentication_required")) {
    return "Sesi login tidak ditemukan. Silakan login ulang.";
  }

  return message;
}

async function getWalletKind(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], walletId: string) {
  const { data, error } = await supabase.from("wallets").select("kind").eq("id", walletId).maybeSingle();

  if (error || !data) {
    redirectToWalletSection(walletId, "savings", "error", error?.message ?? "Wallet tidak ditemukan.");
  }

  return data.kind as "personal" | "shared";
}

function getTargetAmount(formData: FormData) {
  const rawValue = getTrimmedValue(formData, "target_amount");

  if (!rawValue) {
    return null;
  }

  const parsed = getNumericValue(formData, "target_amount");
  return parsed === null ? null : parsed;
}

export async function createSaving(formData: FormData) {
  const walletId = getStringValue(formData, "wallet_id");
  const name = getTrimmedValue(formData, "name");
  const targetAmount = getTargetAmount(formData);
  const { supabase, user } = await requireUser();

  if (!name) {
    redirectToWalletSection(walletId, "savings", "error", "Nama saving harus diisi.");
  }

  if (targetAmount !== null && targetAmount < 0) {
    redirectToWalletSection(walletId, "savings", "error", "Target saving tidak boleh negatif.");
  }

  const { error } = await supabase.from("savings").insert({
    wallet_id: walletId,
    name,
    target_amount: targetAmount,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    redirectToWalletSection(walletId, "savings", "error", mapSavingError(error.message));
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["savings"]
  });
  redirectToWalletSection(walletId, "savings", "message", "Saving berhasil dibuat.");
}

export async function updateSaving(formData: FormData) {
  const walletId = getStringValue(formData, "wallet_id");
  const savingId = getStringValue(formData, "saving_id");
  const name = getTrimmedValue(formData, "name");
  const targetAmount = getTargetAmount(formData);
  const { supabase, user } = await requireUser();

  if (!savingId) {
    redirectToWalletSection(walletId, "savings", "error", "Saving tidak ditemukan.");
  }

  if (!name) {
    redirectToWalletSection(walletId, "savings", "error", "Nama saving harus diisi.");
  }

  if (targetAmount !== null && targetAmount < 0) {
    redirectToWalletSection(walletId, "savings", "error", "Target saving tidak boleh negatif.");
  }

  const { error } = await supabase
    .from("savings")
    .update({
      name,
      target_amount: targetAmount,
      updated_by: user.id
    })
    .eq("id", savingId)
    .eq("wallet_id", walletId);

  if (error) {
    redirectToWalletSection(walletId, "savings", "error", mapSavingError(error.message));
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["savings"]
  });
  redirectToWalletSection(walletId, "savings", "message", "Saving berhasil diperbarui.");
}

export async function archiveSaving(formData: FormData) {
  const walletId = getStringValue(formData, "wallet_id");
  const savingId = getStringValue(formData, "saving_id");
  const { supabase, user } = await requireUser();

  if (!savingId) {
    redirectToWalletSection(walletId, "savings", "error", "Saving tidak ditemukan.");
  }

  const { error } = await supabase
    .from("savings")
    .update({
      is_archived: true,
      updated_by: user.id
    })
    .eq("id", savingId)
    .eq("wallet_id", walletId);

  if (error) {
    redirectToWalletSection(walletId, "savings", "error", mapSavingError(error.message));
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["savings"]
  });
  redirectToWalletSection(walletId, "savings", "message", "Saving berhasil diarsipkan.");
}

async function createSavingEntry(formData: FormData, entryType: "deposit" | "withdraw") {
  const walletId = getStringValue(formData, "wallet_id");
  const savingId = getStringValue(formData, "saving_id");
  const amount = getNumericValue(formData, "amount");
  const happenedAt = getStringValue(formData, "happened_at");
  const note = getNullableText(formData, "note");
  const memberUserId = getTrimmedValue(formData, "member_user_id") || null;
  const { supabase } = await requireUser();

  if (!savingId) {
    redirectToWalletSection(walletId, "savings", "error", "Saving tidak ditemukan.");
  }

  if (!happenedAt || !isValidDateString(happenedAt)) {
    redirectToWalletSection(walletId, "savings", "error", "Tanggal mutasi saving harus valid.");
  }

  if (!amount || amount <= 0) {
    redirectToWalletSection(walletId, "savings", "error", "Nominal mutasi saving harus lebih besar dari nol.");
  }

  if (entryType === "deposit") {
    const walletKind = await getWalletKind(supabase, walletId);

    if (walletKind === "shared" && !memberUserId) {
      redirectToWalletSection(walletId, "savings", "error", "Pilih anggota kontributor untuk setor saving shared.");
    }
  }

  const { error } = await supabase.rpc("create_saving_entry_with_transaction", {
    target_wallet_id: walletId,
    target_saving_id: savingId,
    target_entry_type: entryType,
    target_amount: amount,
    target_happened_at: dateStringToISO(happenedAt),
    target_note: note,
    target_member_user_id: entryType === "deposit" ? memberUserId : null
  });

  if (error) {
    redirectToWalletSection(walletId, "savings", "error", mapSavingError(error.message));
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["savings", "transactions", "budgets", "reports"]
  });
  redirectToWalletSection(
    walletId,
    "savings",
    "message",
    entryType === "deposit" ? "Setor saving berhasil disimpan." : "Penarikan saving berhasil disimpan."
  );
}

export async function createSavingDeposit(formData: FormData) {
  return createSavingEntry(formData, "deposit");
}

export async function createSavingWithdrawal(formData: FormData) {
  return createSavingEntry(formData, "withdraw");
}
