import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { sanitizeRedirectPath, withAuthMessage } from "@/lib/auth-flow";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const siteUrl = getSiteUrl();
  const redirectTo = new URL(next, siteUrl);

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

  const errorRedirectTo = new URL("/auth/error", siteUrl);
  errorRedirectTo.search = withAuthMessage(
    "/auth/error",
    "message",
    "Tautan verifikasi tidak valid atau sudah kedaluwarsa.",
    next
  ).replace("/auth/error", "");
  return NextResponse.redirect(errorRedirectTo);
}
