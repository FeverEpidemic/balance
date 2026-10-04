import { defaultLocale, getLocaleTag, type AppLocale } from "@/lib/i18n";
import type { TransactionRow } from "@/lib/data/types";

export function buildMonthlyReport(transactions: TransactionRow[], locale: AppLocale = defaultLocale, maxMonths: number = 6) {
  const monthlyMap = new Map<string, { income: number; expense: number }>();

  transactions.forEach((transaction) => {
    const monthKey = transaction.happened_at.slice(0, 7);
    const current = monthlyMap.get(monthKey) ?? { income: 0, expense: 0 };

    if (transaction.kind === "income") {
      current.income += transaction.amount;
    } else {
      current.expense += transaction.amount;
    }

    monthlyMap.set(monthKey, current);
  });

  return [...monthlyMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-maxMonths)
    .map(([month, value]) => ({
      month,
      label: new Intl.DateTimeFormat(getLocaleTag(locale), { month: "short", timeZone: "UTC" }).format(
        new Date(`${month}-01T00:00:00.000Z`)
      ),
      income: value.income,
      expense: value.expense
    }));
}
