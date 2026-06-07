import { type NextRequest, NextResponse } from "next/server";
import { createAuthMessageSearchParams, sanitizeRedirectPath } from "@/lib/auth-flow";
import { getSiteUrl } from "@/lib/env";
import { defaultLocale, localizePath, resolveLocale, translate } from "@/lib/i18n";
import { ensureProfileForUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const locale = resolveLocale(requestUrl.searchParams.get("locale") ?? defaultLocale);
  const siteUrl = getSiteUrl();

  if (!code) {
    const redirectTo = new URL(localizePath(locale, "/auth/error"), siteUrl);
    redirectTo.search = createAuthMessageSearchParams(
      "message",
      translate(locale, "auth.callbackMissingCode"),
      next,
      "/dashboard"
    ).toString();
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirectTo = new URL(localizePath(locale, "/auth/error"), siteUrl);
    redirectTo.search = createAuthMessageSearchParams(
      "message",
      translate(locale, "auth.callbackExchangeFailed"),
      next,
      "/dashboard"
    ).toString();
    return NextResponse.redirect(redirectTo);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectTo = new URL(localizePath(locale, "/auth/error"), siteUrl);
    redirectTo.search = createAuthMessageSearchParams(
      "message",
      translate(locale, "auth.callbackSessionMissing"),
      next,
      "/dashboard"
    ).toString();
    return NextResponse.redirect(redirectTo);
  }

  await ensureProfileForUser(user);

  const redirectTo = new URL(localizePath(locale, next), siteUrl);
  return NextResponse.redirect(redirectTo);
}
