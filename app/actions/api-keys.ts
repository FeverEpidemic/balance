"use server";

import { requireUser } from "@/lib/auth";
import { generateApiKey, hashApiKey } from "@/lib/chat-auth";
import { invalidateSettingsCache } from "@/lib/data/cache";
import { errorResult, getActionLocale, getActionTranslator, safeDbError, successResult, type ActionResult } from "@/app/actions/_shared";
import { getTrimmedValue } from "@/app/actions/_shared";
import { revalidatePath } from "next/cache";
import { localizePath } from "@/lib/i18n";

export async function createApiKey(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = getTrimmedValue(formData, "name");
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  if (!name) {
    return errorResult(t("actionErrors.apiKeyNameRequired"));
  }

  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  const { error } = await supabase.from("user_api_keys").insert({
    user_id: user.id,
    name,
    key_hash: keyHash,
    key_prefix: keyPrefix
  });

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  await invalidateSettingsCache(user.id);
  revalidatePath(localizePath(await getActionLocale(), "/settings"));

  return successResult(rawKey, { resetForm: true });
}

export async function revokeApiKey(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const keyId = getTrimmedValue(formData, "key_id");
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  if (!keyId) {
    return errorResult(t("actionErrors.apiKeyNotFound"));
  }

  const { error } = await supabase
    .from("user_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  await invalidateSettingsCache(user.id);
  revalidatePath(localizePath(await getActionLocale(), "/settings"));

  return successResult(t("actionSuccess.apiKeyRevoked"));
}

export async function deleteApiKey(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const keyId = getTrimmedValue(formData, "key_id");
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  if (!keyId) {
    return errorResult(t("actionErrors.apiKeyNotFound"));
  }

  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  await invalidateSettingsCache(user.id);
  revalidatePath(localizePath(await getActionLocale(), "/settings"));

  return successResult(t("actionSuccess.apiKeyDeleted"));
}
