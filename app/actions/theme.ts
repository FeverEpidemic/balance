"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { invalidateDashboardCache, invalidateSettingsCache, invalidateShellDataCache } from "@/lib/data/cache";
import { errorResult, getActionLocale, getTrimmedValue, successResult, type ActionResult } from "@/app/actions/_shared";
import { isLocale, LOCALE_COOKIE_NAME, localizePath, translate } from "@/lib/i18n";
import { THEME_COOKIE_NAME, isThemePreference } from "@/lib/theme";
import { DEFAULT_TIMEZONE, TZ_COOKIE_NAME, resolveTimezone } from "@/lib/timezone";

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
  await invalidateShellDataCache(user.id);
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
  await invalidateShellDataCache(user.id);
  revalidatePath(localizePath(preference, "/settings"));
  revalidatePath("/", "layout");
  redirect(localizePath(preference, "/settings"));
}

export async function updateTimezonePreference(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const preference = getTrimmedValue(formData, "timezone");
  const { supabase, user } = await requireUser();
  const cookieStore = await cookies();
  const locale = await getActionLocale();

  // "auto" berarti hapus override (balik ke auto-detect)
  const resolved = preference === "auto" ? null : resolveTimezone(preference);

  const { error } = await supabase.from("profiles").update({ timezone: resolved }).eq("id", user.id);

  if (error) {
    return errorResult(translate(locale, "actionErrors.unexpectedError"));
  }

  if (resolved) {
    cookieStore.set(TZ_COOKIE_NAME, resolved, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365
    });
  } else {
    cookieStore.delete(TZ_COOKIE_NAME);
  }

  await invalidateSettingsCache(user.id);
  await invalidateShellDataCache(user.id);
  revalidatePath(localizePath(locale, "/settings"));
  revalidatePath("/", "layout");

  return successResult(translate(locale, "settings.timezoneUpdated"));
}

const VALID_CURRENCIES = ["IDR", "USD", "SGD", "MYR", "EUR", "GBP", "JPY", "AUD", "CNY", "SAR", "INR", "PHP", "THB", "KRW", "BND"];

export async function updateDefaultCurrency(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const preference = getTrimmedValue(formData, "default_currency");
  const { supabase, user } = await requireUser();
  const locale = await getActionLocale();

  if (!preference || !VALID_CURRENCIES.includes(preference)) {
    return errorResult(translate(locale, "settings.invalidCurrency"));
  }

  const { error } = await supabase.from("profiles").update({ default_currency: preference }).eq("id", user.id);

  if (error) {
    return errorResult(translate(locale, "actionErrors.unexpectedError"));
  }

  await invalidateSettingsCache(user.id);
  await invalidateShellDataCache(user.id);
  await invalidateDashboardCache([user.id]);
  revalidatePath(localizePath(locale, "/settings"));
  revalidatePath("/", "layout");

  return successResult(translate(locale, "settings.currencyUpdated"));
}
