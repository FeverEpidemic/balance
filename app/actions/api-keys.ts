"use server";

import { requireUser } from "@/lib/auth";
import { generateApiKey, hashApiKey } from "@/lib/chat-auth";
import { invalidateSettingsCache } from "@/lib/data/cache";
import { errorResult, successResult, type ActionResult } from "@/app/actions/_shared";
import { getTrimmedValue } from "@/app/actions/_shared";
import { revalidatePath } from "next/cache";

export async function createApiKey(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = getTrimmedValue(formData, "name");
  const { supabase, user } = await requireUser();

  if (!name) {
    return errorResult("Nama API key harus diisi.");
  }

  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  const { error } = await supabase.from("user_api_keys").insert({
    user_id: user.id,
    name,
    key_hash: keyHash,
    key_prefix: keyPrefix
  });

  if (error) {
    return errorResult(error.message);
  }

  await invalidateSettingsCache(user.id);
  revalidatePath("/settings");

  return successResult(rawKey, { resetForm: true });
}

export async function revokeApiKey(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const keyId = getTrimmedValue(formData, "key_id");
  const { supabase, user } = await requireUser();

  if (!keyId) {
    return errorResult("Key tidak ditemukan.");
  }

  const { error } = await supabase
    .from("user_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) {
    return errorResult(error.message);
  }

  await invalidateSettingsCache(user.id);
  revalidatePath("/settings");

  return successResult("API key berhasil dicabut.");
}

export async function deleteApiKey(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const keyId = getTrimmedValue(formData, "key_id");
  const { supabase, user } = await requireUser();

  if (!keyId) {
    return errorResult("Key tidak ditemukan.");
  }

  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) {
    return errorResult(error.message);
  }

  await invalidateSettingsCache(user.id);
  revalidatePath("/settings");

  return successResult("API key berhasil dihapus permanen.");
}