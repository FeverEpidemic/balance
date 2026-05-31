import { type NextRequest, NextResponse } from "next/server";
import { sanitizeRedirectPath, withAuthMessage } from "@/lib/auth-flow";
import { getSiteUrl } from "@/lib/env";
import { ensureProfileForUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const siteUrl = getSiteUrl();

  if (!code) {
    const redirectTo = new URL("/auth/error", siteUrl);
    redirectTo.search = withAuthMessage(
      "/auth/error",
      "message",
      "Autentikasi Google tidak membawa kode login yang valid.",
      next
    ).replace("/auth/error", "");
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirectTo = new URL("/auth/error", siteUrl);
    redirectTo.search = withAuthMessage(
      "/auth/error",
      "message",
      "Login Google tidak berhasil diproses. Silakan coba lagi.",
      next
    ).replace("/auth/error", "");
    return NextResponse.redirect(redirectTo);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectTo = new URL("/auth/error", siteUrl);
    redirectTo.search = withAuthMessage(
      "/auth/error",
      "message",
      "Sesi Google tidak ditemukan setelah login. Silakan ulangi proses masuk.",
      next
    ).replace("/auth/error", "");
    return NextResponse.redirect(redirectTo);
  }

  await ensureProfileForUser(user);

  const redirectTo = new URL(next, siteUrl);
  return NextResponse.redirect(redirectTo);
}
