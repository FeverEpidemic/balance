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

  if (!amount || amount < 0) {
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
