import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getLocaleTag, resolveLocale, type AppLocale } from "@/lib/i18n";
import { DEFAULT_TIMEZONE, fromUTCISO, nowInTimezone, toUTCISO } from "@/lib/timezone";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function createCurrencyFormatter(locale: AppLocale, currency: string = "IDR") {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  });
}

function parseDateValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCurrency(value: number, locale: AppLocale = "id", currency: string = "IDR") {
  return createCurrencyFormatter(resolveLocale(locale), currency).format(value);
}

export function sanitizeCurrencyInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function formatCurrencyInputValue(value: string | number, locale: AppLocale = "id", currency: string = "IDR") {
  const digits = typeof value === "number" ? String(Math.trunc(value)) : sanitizeCurrencyInput(value);

  if (!digits) {
    return "";
  }

  return createCurrencyFormatter(resolveLocale(locale), currency).format(Number(digits));
}

export function formatShortDate(value: string, locale: AppLocale = "id", timezone: string = DEFAULT_TIMEZONE) {
  const date = parseDateValue(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(getLocaleTag(resolveLocale(locale)), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone
  }).format(date);
}

export function formatDateTime(value: string, locale: AppLocale = "id", options?: Intl.DateTimeFormatOptions, timezone: string = DEFAULT_TIMEZONE) {
  const date = parseDateValue(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(getLocaleTag(resolveLocale(locale)), {
    timeZone: timezone,
    ...options
  }).format(date);
}

export function formatTimeOfDay(value: string, locale: AppLocale = "id", timezone: string = DEFAULT_TIMEZONE) {
  return formatDateTime(value, locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }, timezone);
}

export function getTodayDateString(timezone: string = DEFAULT_TIMEZONE): string {
  return nowInTimezone(timezone).date;
}

export function toDateInputValue(dateString: string, timezone: string = DEFAULT_TIMEZONE): string {
  return fromUTCISO(dateString || null, timezone).date;
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  if (isNaN(date.getTime())) return false;
  const [year, month, day] = value.split("-").map(Number);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}

export function getCurrentTimeString(timezone: string = DEFAULT_TIMEZONE): string {
  return nowInTimezone(timezone).time;
}

export function toTimeInputValue(dateString: string, timezone: string = DEFAULT_TIMEZONE): string {
  return fromUTCISO(dateString || null, timezone).time;
}

export function combineDateAndTime(dateStr: string, timeStr: string | null, timezone: string = DEFAULT_TIMEZONE): string {
  return toUTCISO(dateStr, timeStr, timezone);
}

export function dateStringToISO(value: string): string {
  return new Date(value).toISOString();
}

export function toFileSafeSegment(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
}
