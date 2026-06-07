import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

export const locales = ["id", "en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "id";
export const LOCALE_COOKIE_NAME = "balance-locale";

export type TranslationValues = Record<string, string | number>;
interface MessageDictionary {
  [key: string]: string | MessageDictionary;
}

const localeTags: Record<AppLocale, string> = {
  id: "id-ID",
  en: "en-US"
};

const localizedMessages = {
  id: idMessages,
  en: enMessages
} satisfies Record<AppLocale, MessageDictionary>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends MessageDictionary>(base: T, override: MessageDictionary): T {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const currentValue = result[key];

    if (isObject(currentValue) && isObject(value)) {
      result[key] = deepMerge(currentValue as MessageDictionary, value);
      continue;
    }

    result[key] = value;
  }

  return result as T;
}

function getMessageNode(locale: AppLocale, key: string) {
  const dictionary = getMessages(locale);
  const node = key.split(".").reduce<unknown>((current, part) => {
    if (!isObject(current)) {
      return undefined;
    }

    return current[part];
  }, dictionary);

  return typeof node === "string" ? node : undefined;
}

export function isLocale(value: string | null | undefined): value is AppLocale {
  return locales.includes((value ?? "") as AppLocale);
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  return isLocale(value) ? value : defaultLocale;
}

export function getLocaleTag(locale: AppLocale) {
  return localeTags[locale];
}

export function getMessages(locale: AppLocale) {
  if (locale === defaultLocale) {
    return localizedMessages.id;
  }

  return deepMerge(localizedMessages.id, localizedMessages[locale]);
}

export function translate(locale: AppLocale, key: string, values?: TranslationValues) {
  const template = getMessageNode(locale, key) ?? getMessageNode(defaultLocale, key) ?? key;

  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(values[token] ?? `{${token}}`));
}

export function getTranslator(locale: AppLocale) {
  return (key: string, values?: TranslationValues) => translate(locale, key, values);
}

export function stripLocaleFromPath(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (!isLocale(maybeLocale)) {
    return pathname || "/";
  }

  const nextPath = `/${segments.slice(2).join("/")}`.replace(/\/+/g, "/");
  return nextPath === "/" ? "/" : nextPath.replace(/\/$/, "") || "/";
}

export function localizePath(locale: AppLocale, pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const strippedPath = stripLocaleFromPath(normalizedPath);

  if (strippedPath === "/") {
    return `/${locale}`;
  }

  return `/${locale}${strippedPath}`;
}

export function getLocaleFromPathname(pathname: string) {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : null;
}

export function resolvePreferredLocale(input: {
  pathname?: string | null;
  profileLocale?: string | null;
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}) {
  const pathnameLocale = getLocaleFromPathname(input.pathname ?? "");

  if (pathnameLocale) {
    return pathnameLocale;
  }

  if (isLocale(input.profileLocale)) {
    return input.profileLocale;
  }

  if (isLocale(input.cookieLocale)) {
    return input.cookieLocale;
  }

  const header = input.acceptLanguage?.toLowerCase() ?? "";
  if (header.includes("en")) {
    return "en";
  }

  return defaultLocale;
}
