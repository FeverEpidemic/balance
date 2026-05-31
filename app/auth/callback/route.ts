import { type NextRequest, NextResponse } from "next/server";
import { sanitizeRedirectPath, withAuthMessage } from "@/lib/auth-flow";
import { ensureProfileForUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const nextUrl = new URL(next, request.url);
  const redirectTo = request.nextUrl.clone();

  if (!code) {
    redirectTo.pathname = "/auth/error";
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
    redirectTo.pathname = "/auth/error";
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
    redirectTo.pathname = "/auth/error";
    redirectTo.search = withAuthMessage(
      "/auth/error",
      "message",
      "Sesi Google tidak ditemukan setelah login. Silakan ulangi proses masuk.",
      next
    ).replace("/auth/error", "");
    return NextResponse.redirect(redirectTo);
  }

  await ensureProfileForUser(user);

  redirectTo.pathname = nextUrl.pathname;
  redirectTo.search = nextUrl.search;
  return NextResponse.redirect(redirectTo);
}
