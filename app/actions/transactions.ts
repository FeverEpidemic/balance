"use server";

import { requireUser } from "@/lib/auth";
import { getNullableText, getNumericValue, getStringValue, redirectToWalletSection, revalidateWalletPaths } from "@/app/actions/_shared";

function readTransactionForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    transactionId: getStringValue(formData, "transaction_id"),
    kind: getStringValue(formData, "kind") || "expense",
    categoryId: getStringValue(formData, "category_id"),
    note: getNullableText(formData, "note"),
    amount: getNumericValue(formData, "amount")
  };
}

export async function createTransaction(formData: FormData) {
  const { walletId, kind, categoryId, note, amount } = readTransactionForm(formData);
  const { supabase, user } = await requireUser();

  if (!amount || amount <= 0) {
    redirectToWalletSection(walletId, "transactions", "error", "Nominal transaksi harus lebih besar dari nol.");
  }

  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: categoryId || null,
    kind,
    amount,
    note,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    redirectToWalletSection(walletId, "transactions", "error", error.message);
  }

  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions"]
  });
  redirectToWalletSection(walletId, "transactions", "message", "Transaksi berhasil disimpan.");
}

export async function updateTransaction(formData: FormData) {
  const { walletId, transactionId, kind, categoryId, note, amount } = readTransactionForm(formData);
  const { supabase, user } = await requireUser();

  if (!transactionId) {
    redirectToWalletSection(walletId, "transactions", "error", "Transaksi tidak ditemukan.");
  }

  if (!amount || amount <= 0) {
    redirectToWalletSection(walletId, "transactions", "error", "Nominal transaksi harus lebih besar dari nol.");
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      kind,
      category_id: categoryId || null,
      amount,
      note,
      updated_by: user.id
    })
    .eq("id", transactionId)
    .eq("wallet_id", walletId);

  if (error) {
    redirectToWalletSection(walletId, "transactions", "error", error.message);
  }

  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions"]
  });
  redirectToWalletSection(walletId, "transactions", "message", "Transaksi berhasil diperbarui.");
}

export async function deleteTransaction(formData: FormData) {
  const { walletId, transactionId } = readTransactionForm(formData);
  const { supabase } = await requireUser();

  if (!transactionId) {
    redirectToWalletSection(walletId, "transactions", "error", "Transaksi tidak ditemukan.");
  }

  const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("wallet_id", walletId);

  if (error) {
    redirectToWalletSection(walletId, "transactions", "error", error.message);
  }

  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions"]
  });
  redirectToWalletSection(walletId, "transactions", "message", "Transaksi berhasil dihapus.");
}
