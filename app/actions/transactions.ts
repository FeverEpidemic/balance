"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNumberInput } from "@/lib/finance";
import { requireUser } from "@/lib/auth";

function redirectToTransactions(walletId: string, type: "error" | "message", message: string) {
  redirect(`/wallets/${walletId}/transactions?${new URLSearchParams({ [type]: message }).toString()}`);
}

export async function createTransaction(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const kind = String(formData.get("kind") ?? "expense");
  const categoryId = String(formData.get("category_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseNumberInput(formData.get("amount"));
  const { supabase, user } = await requireUser();

  if (!amount || amount <= 0) {
    redirectToTransactions(walletId, "error", "Nominal transaksi harus lebih besar dari nol.");
  }

  const { error } = await supabase.from("transactions").insert({
    wallet_id: walletId,
    category_id: categoryId || null,
    kind,
    amount,
    note: note || null,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    redirectToTransactions(walletId, "error", error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/wallets/${walletId}`);
  revalidatePath(`/wallets/${walletId}/transactions`);
  redirectToTransactions(walletId, "message", "Transaksi berhasil disimpan.");
}

export async function updateTransaction(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const transactionId = String(formData.get("transaction_id") ?? "");
  const kind = String(formData.get("kind") ?? "expense");
  const categoryId = String(formData.get("category_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseNumberInput(formData.get("amount"));
  const { supabase, user } = await requireUser();

  if (!transactionId) {
    redirectToTransactions(walletId, "error", "Transaksi tidak ditemukan.");
  }

  if (!amount || amount <= 0) {
    redirectToTransactions(walletId, "error", "Nominal transaksi harus lebih besar dari nol.");
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      kind,
      category_id: categoryId || null,
      amount,
      note: note || null,
      updated_by: user.id
    })
    .eq("id", transactionId)
    .eq("wallet_id", walletId);

  if (error) {
    redirectToTransactions(walletId, "error", error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/wallets/${walletId}`);
  revalidatePath(`/wallets/${walletId}/transactions`);
  redirectToTransactions(walletId, "message", "Transaksi berhasil diperbarui.");
}

export async function deleteTransaction(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const transactionId = String(formData.get("transaction_id") ?? "");
  const { supabase } = await requireUser();

  if (!transactionId) {
    redirectToTransactions(walletId, "error", "Transaksi tidak ditemukan.");
  }

  const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("wallet_id", walletId);

  if (error) {
    redirectToTransactions(walletId, "error", error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/wallets/${walletId}`);
  revalidatePath(`/wallets/${walletId}/transactions`);
  redirectToTransactions(walletId, "message", "Transaksi berhasil dihapus.");
}
