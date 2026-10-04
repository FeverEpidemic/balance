import { defaultLocale, getLocaleTag, translate, type AppLocale } from "@/lib/i18n";
import type {
  CategoryRow,
  RecurringTransactionListItem,
  RecurringTransactionRow,
  RecurringTransactionsPageData,
  ShellData,
  WalletMemberRow,
  WalletRow
} from "@/lib/data/types";
import { getCurrentUserRole } from "@/lib/data/mappers/wallets";

function formatRecurringFrequencyLabel(row: RecurringTransactionRow, locale: AppLocale = defaultLocale) {
  if (row.frequency === "daily") {
    return row.interval_count > 1
      ? translate(locale, "recurring.everyXDays", { count: row.interval_count })
      : translate(locale, "recurring.frequencyDaily");
  }

  if (row.frequency === "weekly") {
    return row.interval_count > 1
      ? translate(locale, "recurring.everyXWeeks", { count: row.interval_count })
      : translate(locale, "recurring.frequencyWeekly");
  }

  return row.interval_count > 1
    ? translate(locale, "recurring.everyXMonths", { count: row.interval_count })
    : translate(locale, "recurring.frequencyMonthly");
}

export function buildRecurringTransactionListItems(
  recurringTransactions: RecurringTransactionRow[],
  categories: CategoryRow[],
  locale: AppLocale = defaultLocale
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return [...recurringTransactions]
    .sort((left, right) => {
      const statusRank = { active: 0, paused: 1, ended: 2 };
      return statusRank[left.status] - statusRank[right.status] || left.next_run_at.localeCompare(right.next_run_at);
    })
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      categoryId: row.category_id,
      categoryName: row.category_id
        ? categoryById.get(row.category_id)?.name ?? translate(locale, "common.noCategory")
        : translate(locale, "common.noCategory"),
      amount: row.amount,
      note: row.note,
      frequency: row.frequency,
      intervalCount: row.interval_count,
      frequencyLabel: formatRecurringFrequencyLabel(row, locale),
      startDate: row.start_date,
      endDate: row.end_date,
      nextRunAt: row.next_run_at,
      nextRunLabel: new Intl.DateTimeFormat(getLocaleTag(locale), { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(row.next_run_at)
      ),
      status: row.status,
      lastGeneratedAt: row.last_generated_at
    })) satisfies RecurringTransactionListItem[];
}

export function createRecurringTransactionsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  recurringTransactions: RecurringTransactionRow[];
  locale?: AppLocale;
}) {
  const { shell, wallet, memberships, categories, recurringTransactions, locale = defaultLocale } = args;
  const formCategories = categories.filter((category) => category.kind === "expense" || category.kind === "income");

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    categories: formCategories,
    recurringTransactions: buildRecurringTransactionListItems(
      recurringTransactions.filter((row) => row.wallet_id === wallet.id),
      formCategories,
      locale
    )
  } satisfies RecurringTransactionsPageData;
}
