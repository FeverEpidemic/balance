"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { invalidateSettingsCache } from "@/lib/data/cache";
import { errorResult, getActionLocale, getTrimmedValue, successResult, type ActionResult } from "@/app/actions/_shared";
import { defaultLocale, LOCALE_COOKIE_NAME, localizePath, resolveLocale } from "@/lib/i18n";
import { THEME_COOKIE_NAME, isThemePreference } from "@/lib/theme";

export async function updateThemePreference(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const preference = getTrimmedValue(formData, "theme_preference");
  const { supabase, user } = await requireUser();
  const cookieStore = await cookies();
  const locale = await getActionLocale();

  if (!isThemePreference(preference)) {
    return errorResult(locale === "en" ? "Invalid theme selection." : "Pilihan tema tidak valid.");
  }

  const { error } = await supabase.from("profiles").update({ theme_preference: preference }).eq("id", user.id);

  if (error) {
    return errorResult(error.message);
  }

  cookieStore.set(THEME_COOKIE_NAME, preference, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  await invalidateSettingsCache(user.id);
  revalidatePath(localizePath(locale, "/settings"));
  revalidatePath("/", "layout");

  return successResult(locale === "en" ? "App theme updated successfully." : "Tema aplikasi berhasil diperbarui.");
}

export async function updateLocalePreference(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const preference = getTrimmedValue(formData, "preferred_locale");
  const { supabase, user } = await requireUser();

  if (preference !== "id" && preference !== "en") {
    return errorResult("Pilihan bahasa tidak valid.");
  }

  const { error } = await supabase.from("profiles").update({ preferred_locale: preference }).eq("id", user.id);

  if (error) {
    return errorResult(error.message);
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, preference, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  await invalidateSettingsCache(user.id);
  revalidatePath(localizePath(preference, "/settings"));
  revalidatePath("/", "layout");

  return successResult(preference === "en" ? "App language updated successfully." : "Bahasa aplikasi berhasil diperbarui.");
}
