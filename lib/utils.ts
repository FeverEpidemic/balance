import { getLocaleTag, resolveLocale, type AppLocale } from "@/lib/i18n";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function createCurrencyFormatter(locale: AppLocale) {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });
}

export function formatCurrency(value: number, locale: AppLocale = "id") {
  return createCurrencyFormatter(resolveLocale(locale)).format(value);
}

export function sanitizeCurrencyInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function formatCurrencyInputValue(value: string | number, locale: AppLocale = "id") {
  const digits = typeof value === "number" ? String(Math.trunc(value)) : sanitizeCurrencyInput(value);

  if (!digits) {
    return "";
  }

  return createCurrencyFormatter(resolveLocale(locale)).format(Number(digits));
}

export function formatShortDate(value: string, locale: AppLocale = "id") {
  if (!value) return "";
  return new Intl.DateTimeFormat(getLocaleTag(resolveLocale(locale)), {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string, locale: AppLocale = "id", options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(getLocaleTag(resolveLocale(locale)), options).format(new Date(value));
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateInputValue(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return getTodayDateString();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  if (isNaN(date.getTime())) return false;
  const [year, month, day] = value.split("-").map(Number);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}

export function dateStringToISO(value: string): string {
  return new Date(value).toISOString();
}
