"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNumberInput } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getActionLocale, getLocalizedPath } from "@/app/actions/_shared";
import { translate } from "@/lib/i18n";

async function redirectToSettlements(walletId: string, type: "error" | "message", message: string) {
  const path = await getLocalizedPath(`/wallets/${walletId}/settlements`);
  redirect(`${path}?${new URLSearchParams({ [type]: message }).toString()}`);
}

export async function createSettlement(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const payerUserId = String(formData.get("payer_user_id") ?? "");
  const payeeUserId = String(formData.get("payee_user_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseNumberInput(formData.get("amount"));
  const { supabase, user } = await requireUser();
  const locale = await getActionLocale();

  if (!amount || amount <= 0) {
    await redirectToSettlements(walletId, "error", translate(locale, "settlements.amountInvalid"));
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
    await redirectToSettlements(walletId, "error", translate(locale, "actionErrors.unexpectedError"));
  }

  revalidatePath(await getLocalizedPath(`/wallets/${walletId}/settlements`));
  await redirectToSettlements(walletId, "message", translate(locale, "settlements.savedMessage"));
}
