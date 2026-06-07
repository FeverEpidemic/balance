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
  const params = new URLSearchParams({ [key]: value });
  const safeNext = sanitizeRedirectPath(next, fallbackNext);

  if (safeNext !== fallbackNext) {
    params.set("next", safeNext);
  }

  return `${localizePath(locale, path)}?${params.toString()}`;
}
