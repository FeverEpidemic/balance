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

/** Menambah Cloudflare-friendly cache headers utk halaman publik. */
function addCacheHeaders(response: NextResponse, ttlSeconds: number) {
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${ttlSeconds}, max-age=0, stale-while-revalidate=${ttlSeconds * 3}`
  );
}

function isPublicPath(pathname: string) {
  const path = stripLocaleFromPath(pathname);
  return (
    path === "/" ||
    path === "/privacy" ||
    path === "/terms" ||
    path === "/refund-policy" ||
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
    const res = NextResponse.redirect(redirectUrl, 301);
    addCacheHeaders(res, 86400); // Cloudflare cache 1 day
    return res;
  }

  if (!pathnameLocale && !pathname.startsWith("/api/") && !pathname.startsWith("/auth/")) {
    const detectedLocale = resolvePreferredLocale({
      pathname,
      cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
      acceptLanguage: request.headers.get("accept-language")
    });
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePath(detectedLocale, pathname);
    return NextResponse.redirect(redirectUrl, 301);
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

  // Cache public pages at Cloudflare edge for faster repeat visits
  const stripped = stripLocaleFromPath(pathname);
  if (!user && isPublicPath(pathname)) {
    if (stripped === "/login" || stripped === "/register") {
      addCacheHeaders(response, 3600); // 1 hour
    } else {
      addCacheHeaders(response, 86400); // 1 day: landing, privacy, terms, offline
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|opengraph-image|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
