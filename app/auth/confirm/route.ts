import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createAuthMessageSearchParams, sanitizeRedirectPath } from "@/lib/auth-flow";
import { getSiteUrl } from "@/lib/env";
import { defaultLocale, localizePath, resolveLocale, translate } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const locale = resolveLocale(requestUrl.searchParams.get("locale") ?? defaultLocale);
  const siteUrl = getSiteUrl();
  const redirectTo = new URL(localizePath(locale, next), siteUrl);

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  const errorRedirectTo = new URL(localizePath(locale, "/auth/error"), siteUrl);
  errorRedirectTo.search = createAuthMessageSearchParams(
    "message",
    translate(locale, "auth.confirmInvalidLink"),
    next,
    "/dashboard"
  ).toString();
  return NextResponse.redirect(errorRedirectTo);
}
