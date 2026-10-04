import { getPreviousSalaryPeriod, getSalaryPeriodRange } from "@/lib/finance";
import type { TransactionRow } from "@/lib/data/types";

/** Returns a filter function that keeps only the first item with each id. */
export function deduplicateById<T extends { id: string }>(): (item: T) => boolean {
  const seen = new Set<string>();
  return (item) => {
    const dup = seen.has(item.id);
    seen.add(item.id);
    return !dup;
  };
}

export function isSamePeriod(dateValue: string, periodKey: string, cycleDay: number = 1): boolean {
  if (cycleDay <= 1) return dateValue.slice(0, 7) === periodKey;
  const { start, end } = getSalaryPeriodRange(periodKey, cycleDay);
  return dateValue >= start && dateValue <= end;
}

export function getPreviousPeriod(periodKey: string, cycleDay: number = 1): string {
  return getPreviousSalaryPeriod(periodKey, cycleDay);
}

export function filterTransactionsByMonth(transactions: TransactionRow[], month: string, cycleDay: number = 1) {
  return transactions.filter((transaction) => isSamePeriod(transaction.happened_at, month, cycleDay));
}
