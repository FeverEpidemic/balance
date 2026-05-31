import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { sanitizeRedirectPath, withAuthMessage } from "@/lib/auth-flow";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const nextUrl = new URL(next, request.url);
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = nextUrl.pathname;
  redirectTo.search = nextUrl.search;

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

  redirectTo.pathname = "/auth/error";
  redirectTo.search = "";
  redirectTo.search = withAuthMessage(
    "/auth/error",
    "message",
    "Tautan verifikasi tidak valid atau sudah kedaluwarsa.",
    next
  ).replace("/auth/error", "");
  return NextResponse.redirect(redirectTo);
}
