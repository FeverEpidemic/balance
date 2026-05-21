"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNumberInput } from "@/lib/finance";
import { requireUser } from "@/lib/auth";

function redirectToSettlements(walletId: string, type: "error" | "message", message: string) {
  redirect(`/wallets/${walletId}/settlements?${new URLSearchParams({ [type]: message }).toString()}`);
}

export async function createSettlement(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const payerUserId = String(formData.get("payer_user_id") ?? "");
  const payeeUserId = String(formData.get("payee_user_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseNumberInput(formData.get("amount"));
  const { supabase, user } = await requireUser();

  if (!amount || amount <= 0) {
    redirectToSettlements(walletId, "error", "Nominal settlement tidak valid.");
  }

  const { error } = await supabase.from("settlements").insert({
    wallet_id: walletId,
    payer_user_id: payerUserId,
    payee_user_id: payeeUserId,
    amount,
    note: note || null,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    redirectToSettlements(walletId, "error", error.message);
  }

  revalidatePath(`/wallets/${walletId}/settlements`);
  redirectToSettlements(walletId, "message", "Settlement berhasil disimpan.");
}
