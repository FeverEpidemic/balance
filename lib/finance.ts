import { formatCurrency } from "@/lib/utils";

export function parseNumberInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/[^\d-]/g, "");

  if (!normalized || normalized === "-") {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function getMonthDateRange(monthInput: string) {
  const [year, month] = monthInput.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Menghitung tanggal mulai periode gaji.
 * cycleDay=1: 2026-06-01 (awal bulan)
 * cycleDay=25, monthKey="2026-06": 2026-06-25
 */
export function getSalaryPeriodStart(monthKey: string, cycleDay: number): string {
  if (cycleDay <= 1) return `${monthKey}-01`;
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, cycleDay));
  return d.toISOString().slice(0, 10);
}

/**
 * Menghitung rentang tanggal satu periode.
 * cycleDay=25, monthKey="2026-06": { start: "2026-06-25", end: "2026-07-24" }
 */
export function getSalaryPeriodRange(monthKey: string, cycleDay: number): { start: string; end: string } {
  const start = getSalaryPeriodStart(monthKey, cycleDay);
  if (cycleDay <= 1) {
    const [y, m] = monthKey.split("-").map(Number);
    const e = new Date(Date.UTC(y, m, 0));
    return { start, end: e.toISOString().slice(0, 10) };
  }
  const [y, m] = monthKey.split("-").map(Number);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const endDate = new Date(Date.UTC(nextYear, nextMonth - 1, cycleDay));
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  return { start, end: endDate.toISOString().slice(0, 10) };
}

/**
 * Cek apakah suatu tanggal masuk dalam periode gaji.
 */
export function isSameSalaryPeriod(dateStr: string, periodKey: string, cycleDay: number): boolean {
  if (cycleDay <= 1) return dateStr.slice(0, 7) === periodKey;
  const { start, end } = getSalaryPeriodRange(periodKey, cycleDay);
  return dateStr >= start && dateStr <= end;
}

/**
 * Periode sebelumnya berdasarkan periodKey dan cycleDay.
 * cycleDay=25, periodKey="2026-06": returns "2026-05"
 */
export function getPreviousSalaryPeriod(periodKey: string, cycleDay: number): string {
  const [y, m] = periodKey.split("-").map(Number);
  if (cycleDay <= 1) {
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}

/**
 * Format label periode untuk UI.
 * cycleDay=1: "Juni 2026"
 * cycleDay=25: "25 Jun – 24 Jul 2026"
 */
export function formatSalaryPeriodLabel(periodKey: string, cycleDay: number, locale: "id" | "en" = "id"): string {
  const { start, end } = getSalaryPeriodRange(periodKey, cycleDay);
  if (cycleDay <= 1) {
    const d = new Date(start);
    return d.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { month: "long", year: "numeric" });
  }
  const fmt = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short" });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export function describeBudgetUsage(used: number, limit: number, currency: string = "IDR") {
  if (limit <= 0) {
    return "Belum ada limit";
  }

  const percentage = Math.round((used / limit) * 100);
  return `${formatCurrency(used, "id", currency)} dari ${formatCurrency(limit, "id", currency)} (${percentage}%)`;
}
