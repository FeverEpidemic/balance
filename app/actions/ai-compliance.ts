"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { invalidateSettingsCache } from "@/lib/data/cache";
import { errorResult, getActionLocale, successResult, type ActionResult } from "@/app/actions/_shared";
import { AI_CHAT_CONSENT_VERSION } from "@/lib/ai/compliance";
import { localizePath, translate } from "@/lib/i18n";

async function revalidateAiChatCompliancePaths(userId: string, locale: Awaited<ReturnType<typeof getActionLocale>>) {
  await invalidateSettingsCache(userId);
  revalidatePath(localizePath(locale, "/settings"));
  revalidatePath(localizePath(locale, "/chat"));
}

export async function acceptAiChatConsentAndEnable(_prevState: ActionResult, _formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const locale = await getActionLocale();

  const { error } = await supabase
    .from("profiles")
    .update({
      ai_chat_enabled: true,
      ai_chat_consent_version: AI_CHAT_CONSENT_VERSION,
      ai_chat_consented_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    return errorResult(translate(locale, "actionErrors.unexpectedError"));
  }

  await revalidateAiChatCompliancePaths(user.id, locale);
  return successResult(translate(locale, "settings.aiChatEnabledSuccess"));
}

export async function disableAiChat(_prevState: ActionResult, _formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const locale = await getActionLocale();

  const { error } = await supabase
    .from("profiles")
    .update({
      ai_chat_enabled: false
    })
    .eq("id", user.id);

  if (error) {
    return errorResult(translate(locale, "actionErrors.unexpectedError"));
  }

  await revalidateAiChatCompliancePaths(user.id, locale);
  return successResult(translate(locale, "settings.aiChatDisabledSuccess"));
}
