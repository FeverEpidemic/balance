import { getCurrentMonthKey } from "@/lib/finance";
import { buildMonthlyReport, type WalletBundle } from "@/lib/data";
import { defaultLocale, getLocaleTag, translate, type AppLocale } from "@/lib/i18n";
import type { ReportCategoryRow, ReportPdfData } from "@/lib/pdf/types";

function formatMonthLabel(monthKey: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${monthKey}-01T00:00:00.000Z`));
}

export function buildReportPdfData(bundle: WalletBundle, locale: AppLocale = defaultLocale): ReportPdfData {
  const monthlyRows = buildMonthlyReport(bundle.transactions, locale).map((row) => ({
    ...row,
    net: row.income - row.expense
  }));
  const latestMonthKey = monthlyRows.at(-1)?.month ?? getCurrentMonthKey();
  const latestMonthRow = monthlyRows.at(-1) ?? { income: 0, expense: 0, net: 0 };
  const expenseTransactions = bundle.transactions.filter(
    (transaction) => transaction.kind === "expense" && transaction.happened_at.slice(0, 7) === latestMonthKey
  );
  const categoryById = new Map(bundle.categories.map((category) => [category.id, category]));
  const categoryMap = new Map<string, ReportCategoryRow>();

  expenseTransactions.forEach((transaction) => {
    const category = transaction.category_id ? categoryById.get(transaction.category_id) : null;
    const key = category?.name ?? translate(locale, "common.noCategory");
    const current = categoryMap.get(key) ?? {
      name: key,
      color: category?.color ?? "#595f3d",
      amount: 0,
      share: 0
    };
    current.amount += transaction.amount;
    categoryMap.set(key, current);
  });

  const totalExpense = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const categoryRows = [...categoryMap.values()]
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 6)
    .map((row) => ({
      ...row,
      share: totalExpense > 0 ? row.amount / totalExpense : 0
    }));

  return {
    locale,
    walletName: bundle.wallet.name,
    period: {
      monthKey: latestMonthKey,
      monthLabel: formatMonthLabel(latestMonthKey, locale),
      generatedAt: new Date().toISOString()
    },
    summary: {
      income: latestMonthRow.income,
      expense: latestMonthRow.expense,
      net: latestMonthRow.net
    },
    monthlyRows,
    categoryRows
  };
}
