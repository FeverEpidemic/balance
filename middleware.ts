import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";
import {
  LOCALE_COOKIE_NAME,
  defaultLocale,
  getLocaleFromPathname,
  isLocale,
  localizePath,
  resolvePreferredLocale,
  stripLocaleFromPath
} from "@/lib/i18n";

const authRoutes = new Set(["/login", "/register"]);
type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function isPublicPath(pathname: string) {
  const path = stripLocaleFromPath(pathname);
  return (
    path === "/" ||
    path === "/privacy" ||
    path === "/terms" ||
    path === "/offline" ||
    path === "/sw.js" ||
    path === "/manifest.webmanifest" ||
    path === "/api/chat" ||
    path.startsWith("/api/chat/") ||
    authRoutes.has(path) ||
    path.startsWith("/auth/") ||
    path.startsWith("/invite/")
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = getLocaleFromPathname(pathname);
  const locale = pathnameLocale ?? defaultLocale;
  const localizedPath = stripLocaleFromPath(pathname);
  const shouldCheckUser = !isPublicPath(pathname) || authRoutes.has(localizedPath);

  if (pathname === "/") {
    const detectedLocale = resolvePreferredLocale({
      pathname,
      cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
      acceptLanguage: request.headers.get("accept-language")
    });
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePath(detectedLocale, "/");
    return NextResponse.redirect(redirectUrl);
  }

  if (!pathnameLocale && !pathname.startsWith("/api/") && !pathname.startsWith("/auth/")) {
    const detectedLocale = resolvePreferredLocale({
      pathname,
      cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
      acceptLanguage: request.headers.get("accept-language")
    });
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePath(detectedLocale, pathname);
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({
    request
  });
  let user = null;

  if (shouldCheckUser) {
    const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({
            request
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as never);
          });
        }
      }
    });

    const {
      data: { user: resolvedUser }
    } = await supabase.auth.getUser();

    user = resolvedUser;
  }

  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = localizePath(locale, "/login");
    loginUrl.searchParams.set("next", localizedPath);
    return NextResponse.redirect(loginUrl);
  }

  if (user && authRoutes.has(localizedPath)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = localizePath(locale, "/dashboard");
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
