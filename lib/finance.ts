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

export function describeBudgetUsage(used: number, limit: number, currency: string = "IDR") {
  if (limit <= 0) {
    return "Belum ada limit";
  }

  const percentage = Math.round((used / limit) * 100);
  return `${formatCurrency(used, "id", currency)} dari ${formatCurrency(limit, "id", currency)} (${percentage}%)`;
}
