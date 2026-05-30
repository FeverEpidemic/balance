"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseNumberInput } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { invalidateWalletCache } from "@/lib/data/cache";

function redirectToTemplates(walletId: string, type: "error" | "message", message: string) {
  redirect(`/wallets/${walletId}/templates?${new URLSearchParams({ [type]: message }).toString()}`);
}

export async function createTemplate(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const kind = String(formData.get("kind") ?? "expense");
  const name = String(formData.get("name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const defaultAmount = parseNumberInput(formData.get("default_amount"));
  const { supabase, user } = await requireUser();

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
    redirectToTemplates(walletId, "error", error.message);
  }

  await invalidateWalletCache(walletId);
  revalidatePath(`/wallets/${walletId}/templates`);
  redirectToTemplates(walletId, "message", "Template berhasil disimpan.");
}
