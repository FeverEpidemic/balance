"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { invalidateSettingsCache } from "@/lib/data/cache";
import { errorResult, getActionLocale, getTrimmedValue, successResult, type ActionResult } from "@/app/actions/_shared";
import { isLocale, LOCALE_COOKIE_NAME, localizePath, translate } from "@/lib/i18n";
import { THEME_COOKIE_NAME, isThemePreference } from "@/lib/theme";

export async function updateThemePreference(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const preference = getTrimmedValue(formData, "theme_preference");
  const { supabase, user } = await requireUser();
  const cookieStore = await cookies();
  const locale = await getActionLocale();

  if (!isThemePreference(preference)) {
    return errorResult(translate(locale, "settings.invalidTheme"));
  }

  const { error } = await supabase.from("profiles").update({ theme_preference: preference }).eq("id", user.id);

  if (error) {
    return errorResult(translate(locale, "actionErrors.unexpectedError"));
  }

  cookieStore.set(THEME_COOKIE_NAME, preference, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  await invalidateSettingsCache(user.id);
  revalidatePath(localizePath(locale, "/settings"));
  revalidatePath("/", "layout");

  return successResult(translate(locale, "settings.themeUpdated"));
}

export async function updateLocalePreference(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const preference = getTrimmedValue(formData, "preferred_locale");
  const { supabase, user } = await requireUser();
  const locale = await getActionLocale();

  if (!isLocale(preference)) {
    return errorResult(translate(locale, "settings.invalidLocale"));
  }

  const { error } = await supabase.from("profiles").update({ preferred_locale: preference }).eq("id", user.id);

  if (error) {
    return errorResult(translate(locale, "actionErrors.unexpectedError"));
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
  redirect(localizePath(preference, "/settings"));
}
