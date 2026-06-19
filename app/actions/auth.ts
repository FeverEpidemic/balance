"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { defaultLocale, LOCALE_COOKIE_NAME, localizePath, resolveLocale, translate } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath, withAuthMessage } from "@/lib/auth-flow";
import { ensureProfileForUser } from "@/lib/profile";
import { getSiteUrl } from "@/lib/env";
import { consumeLoginRateLimit } from "@/lib/rate-limit";

export async function login(formData: FormData) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? defaultLocale);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeRedirectPath(String(formData.get("next") ?? "/dashboard"));

  // Rate limit: 5 attempts per 15 minutes per IP
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await consumeLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    redirect(withAuthMessage("/login", "error", translate(locale, "actionErrors.loginRateLimited"), next, "/dashboard", locale));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(withAuthMessage("/login", "error", error.message, next, "/dashboard", locale));
  }

  if (data.user) {
    await ensureProfileForUser(data.user);
  }

  revalidatePath("/", "layout");
  redirect(localizePath(locale, next));
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? defaultLocale);
  const walletReadyMessage = translate(locale, "auth.accountActiveMessage");
  const verificationMessage = translate(locale, "auth.checkEmailMessage");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeRedirectPath(
    String(formData.get("next") ?? `/wallets?message=${walletReadyMessage}`),
    `/wallets?message=${walletReadyMessage}`
  );

  // Rate limit signup attempts per IP
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await consumeLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    redirect(withAuthMessage("/register", "error", translate(locale, "actionErrors.loginRateLimited"), next, `/wallets?message=${walletReadyMessage}`, locale));
  }

  const origin = getSiteUrl();
  const confirmUrl = new URL("/auth/confirm", origin);
  confirmUrl.searchParams.set("next", next);
  confirmUrl.searchParams.set("locale", locale);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: confirmUrl.toString()
    }
  });

  if (error) {
    redirect(
      withAuthMessage(
        "/register",
        "error",
        error.message,
        next,
        `/wallets?message=${walletReadyMessage}`,
        locale
      )
    );
  }

  if (data.user) {
    await ensureProfileForUser(data.user);
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(localizePath(locale, next));
  }

  redirect(
    withAuthMessage(
      "/register",
      "message",
      verificationMessage,
      next,
      `/wallets?message=${walletReadyMessage}`,
      locale
    )
  );
}

export async function logout() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? defaultLocale);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(localizePath(locale, "/login"));
}
