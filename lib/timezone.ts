/**
 * Timezone helpers — auto-detect user timezone via browser + cookie fallback.
 *
 * Flow:
 * 1. Browser detects timezone via Intl API → sets "balance-tz" cookie
 * 2. Server reads cookie for SSR consistency
 * 3. Fallback: Asia/Jakarta (pengguna mayoritas Indonesia)
 */

export const TZ_COOKIE_NAME = "balance-tz";
export const DEFAULT_TIMEZONE = "Asia/Jakarta";

/**
 * Known Indonesian timezone offsets (menit). Tidak ada DST.
 */
const INDONESIAN_OFFSETS: Record<string, number> = {
  "Asia/Jakarta": 7 * 60,   // WIB  — UTC+7
  "Asia/Makassar": 8 * 60,  // WITA — UTC+8
  "Asia/Jayapura": 9 * 60,  // WIT  — UTC+9
};

/**
 * Validasi IANA timezone string. Return DEFAULT_TIMEZONE kalau invalid.
 */
export function resolveTimezone(tz: string | null | undefined): string {
  if (!tz) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Konversi tanggal + jam (dalam timezone tertentu) ke UTC ISO string.
 *
 * Contoh:
 *   toUTCISO("2025-07-15", "14:30", "Asia/Jakarta") → "2025-07-15T07:30:00.000Z"
 *   toUTCISO("2025-07-15", null, "Asia/Makassar")   → "2025-07-14T16:00:00.000Z"
 */
export function toUTCISO(dateStr: string, timeStr: string | null, timezone: string = DEFAULT_TIMEZONE): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  let hours = 0;
  let minutes = 0;

  if (timeStr) {
    const parts = timeStr.split(":");
    hours = Number(parts[0]) || 0;
    minutes = Number(parts[1]) || 0;
  }

  // Untuk Indonesian timezone (tanpa DST): offset tetap
  const fixedOffset = INDONESIAN_OFFSETS[timezone];
  if (fixedOffset !== undefined) {
    const utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
    return new Date(utcMs - fixedOffset * 60 * 1000).toISOString();
  }

  // Untuk timezone lain: hitung offset via Intl API
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  const tzDateStr = utcDate.toLocaleString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
  const tzTimeStr = utcDate.toLocaleString("en", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }); // HH:mm

  const [ty, tm, td] = tzDateStr.split("-").map(Number);
  const [th, tmi] = tzTimeStr.split(":").map(Number);
  const localMs = Date.UTC(ty, tm - 1, td, th, tmi, 0);
  const offsetMinutes = (localMs - utcDate.getTime()) / (60 * 1000);

  return new Date(utcDate.getTime() - offsetMinutes * 60 * 1000).toISOString();
}

// Alias backward-compat untuk default Asia/Jakarta
export const toJakartaISO = (dateStr: string, timeStr: string | null) => toUTCISO(dateStr, timeStr, DEFAULT_TIMEZONE);

/**
 * Parse UTC ISO string ke komponen { date, time } dalam timezone tertentu.
 * Fallback ke nowInTimezone() kalau input null/invalid.
 */
export function fromUTCISO(isoString: string | null, timezone: string = DEFAULT_TIMEZONE): { date: string; time: string } {
  if (!isoString) return nowInTimezone(timezone);

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return nowInTimezone(timezone);

  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }); // YYYY-MM-DD
  const timeFormatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return {
    date: dateFormatter.format(date),
    time: timeFormatter.format(date)
  };
}

// Alias backward-compat
export const fromJakartaISO = (isoString: string | null) => fromUTCISO(isoString, DEFAULT_TIMEZONE);

/**
 * Waktu sekarang di timezone tertentu sebagai { date, time }.
 */
export function nowInTimezone(timezone: string = DEFAULT_TIMEZONE): { date: string; time: string } {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }); // YYYY-MM-DD
  const timeFormatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return {
    date: dateFormatter.format(now),
    time: timeFormatter.format(now)
  };
}

// Alias backward-compat
export const nowInJakarta = () => nowInTimezone(DEFAULT_TIMEZONE);
