"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNumberInput } from "@/lib/finance";
import { requireUser } from "@/lib/auth";

function redirectToBudgets(walletId: string, type: "error" | "message", message: string) {
  redirect(`/wallets/${walletId}/budgets?${new URLSearchParams({ [type]: message }).toString()}`);
}

export async function createBudget(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const monthStart = String(formData.get("month_start") ?? "");
  const amount = parseNumberInput(formData.get("amount"));
  const { supabase, user } = await requireUser();

  if (amount === null || amount < 0) {
    redirectToBudgets(walletId, "error", "Nominal budget tidak valid.");
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      wallet_id: walletId,
      category_id: categoryId,
      month_start: `${monthStart}-01`,
      amount,
      created_by: user.id,
      updated_by: user.id
    },
    {
      onConflict: "wallet_id,category_id,month_start"
    }
  );

  if (error) {
    redirectToBudgets(walletId, "error", error.message);
  }

  revalidatePath(`/wallets/${walletId}`);
  revalidatePath(`/wallets/${walletId}/budgets`);
  redirectToBudgets(walletId, "message", "Budget berhasil disimpan.");
}

export async function updateBudget(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const budgetId = String(formData.get("budget_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const monthStart = String(formData.get("month_start") ?? "");
  const amount = parseNumberInput(formData.get("amount"));
  const { supabase, user } = await requireUser();

  if (!budgetId) {
    redirectToBudgets(walletId, "error", "Budget tidak ditemukan.");
  }

  if (amount === null || amount < 0) {
    redirectToBudgets(walletId, "error", "Nominal budget tidak valid.");
  }

  const { error } = await supabase
    .from("budgets")
    .update({
      category_id: categoryId,
      month_start: `${monthStart}-01`,
      amount,
      updated_by: user.id
    })
    .eq("id", budgetId)
    .eq("wallet_id", walletId);

  if (error) {
    redirectToBudgets(walletId, "error", error.message);
  }

  revalidatePath(`/wallets/${walletId}`);
  revalidatePath(`/wallets/${walletId}/budgets`);
  redirectToBudgets(walletId, "message", "Budget berhasil diperbarui.");
}

export async function deleteBudget(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const budgetId = String(formData.get("budget_id") ?? "");
  const { supabase } = await requireUser();

  if (!budgetId) {
    redirectToBudgets(walletId, "error", "Budget tidak ditemukan.");
  }

  const { error } = await supabase.from("budgets").delete().eq("id", budgetId).eq("wallet_id", walletId);

  if (error) {
    redirectToBudgets(walletId, "error", error.message);
  }

  revalidatePath(`/wallets/${walletId}`);
  revalidatePath(`/wallets/${walletId}/budgets`);
  redirectToBudgets(walletId, "message", "Budget berhasil dihapus.");
}
