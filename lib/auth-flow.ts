import { defaultLocale, localizePath, stripLocaleFromPath, type AppLocale } from "@/lib/i18n";

export function sanitizeRedirectPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next) {
    return fallback;
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return stripLocaleFromPath(next);
}

export function withAuthMessage(
  path: string,
  key: "error" | "message",
  value: string,
  next?: string | null,
  fallbackNext = "/dashboard",
  locale: AppLocale = defaultLocale
) {
  return `${localizePath(locale, path)}?${createAuthMessageSearchParams(key, value, next, fallbackNext).toString()}`;
}

export function createAuthMessageSearchParams(
  key: "error" | "message",
  value: string,
  next?: string | null,
  fallbackNext = "/dashboard"
) {
  const params = new URLSearchParams({ [key]: value });
  const safeNext = sanitizeRedirectPath(next, fallbackNext);

  if (safeNext !== fallbackNext) {
    params.set("next", safeNext);
  }

  return params;
}
