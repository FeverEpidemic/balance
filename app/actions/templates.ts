"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNumberInput } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import { getActionLocale, getLocalizedPath } from "@/app/actions/_shared";
import { translate } from "@/lib/i18n";

async function redirectToTemplates(walletId: string, type: "error" | "message", message: string) {
  const path = await getLocalizedPath(`/wallets/${walletId}/templates`);
  redirect(`${path}?${new URLSearchParams({ [type]: message }).toString()}`);
}

export async function createTemplate(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const kind = String(formData.get("kind") ?? "expense");
  const name = String(formData.get("name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const defaultAmount = parseNumberInput(formData.get("default_amount"));
  const { supabase, user } = await requireUser();
  const locale = await getActionLocale();

  if (defaultAmount !== null && defaultAmount < 0) {
    await redirectToTemplates(walletId, "error", translate(locale, "templates.amountInvalid"));
  }

  const { error } = await supabase.from("transaction_templates").insert({
    wallet_id: walletId,
    category_id: categoryId || null,
    kind,
    name,
    note: note || null,
    default_amount: defaultAmount,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    await redirectToTemplates(walletId, "error", error.message);
  }

  await invalidateWalletReadCaches(walletId, { targets: ["overview"] });
  revalidatePath(await getLocalizedPath(`/wallets/${walletId}/templates`));
  await redirectToTemplates(walletId, "message", translate(locale, "templates.savedMessage"));
}
