import { describeBudgetUsage, getMonthDateRange } from "@/lib/finance";
import {
  isBalanceAdjustmentCategory,
  isBalanceAdjustmentSource,
  isSavingAdjustmentSource
} from "@/lib/balance-adjustments";
import { defaultLocale, getLocaleTag, translate, type AppLocale } from "@/lib/i18n";
import type {
  BudgetProgressItem,
  BudgetRow,
  BudgetsPageData,
  CategoriesPageData,
  CategoryRow,
  DailyExpenseItem,
  DashboardOnboarding,
  DashboardOnboardingStep,
  DashboardCategorySpend,
  DashboardData,
  DashboardRecentTransaction,
  RecurringTransactionListItem,
  RecurringTransactionRow,
  RecurringTransactionsPageData,
  SavingContributionItem,
  SavingEntryListItem,
  SavingEntryRow,
  SavingListItem,
  SavingRow,
  SavingsPageData,
  ShellData,
  TemplateRow,
  TransactionRow,
  TransactionSplitRow,
  TransactionHistoryPageData,
  TransactionHistorySortField,
  TransactionCreateContext,
  TransactionsPageData,
  WalletMemberRow,
  WalletOverviewData,
  WalletRole,
  WalletRoleSummary,
  WalletRow,
  WalletSummary,
  SortDirection
} from "@/lib/data/types";

/** Returns a filter function that keeps only the first item with each id. */
function deduplicateById<T extends { id: string }>(): (item: T) => boolean {
  const seen = new Set<string>();
  return (item) => {
    const dup = seen.has(item.id);
    seen.add(item.id);
    return !dup;
  };
}

function isSameMonth(dateValue: string, month: string) {
  return dateValue.slice(0, 7) === month;
}

function getPreviousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Menghitung carry-over amount untuk kategori budget tertentu.
 * Rekursif & memoized: sisa budget bulan lalu di-chain ke bulan berikutnya.
 */
function calculateCarryOver(
  categoryId: string,
  month: string,
  allBudgets: BudgetRow[],
  transactions: TransactionRow[],
  memo: Map<string, number>
): number {
  const key = `${categoryId}-${month}`;
  if (memo.has(key)) return memo.get(key)!;

  const prevMonthStr = getPreviousMonth(month);
  const prevBudget = allBudgets.find(
    (b) => b.category_id === categoryId && b.month_start === prevMonthStr
  );

  // Jika bulan lalu tidak ada budget atau carry-over tidak diaktifkan, sisa = 0
  if (!prevBudget || !prevBudget.carry_over_enabled) {
    memo.set(key, 0);
    return 0;
  }

  // Hitung sisa budget bulan lalu (termasuk carry-over dari bulan sebelumnya)
  const prevCarryOver = calculateCarryOver(categoryId, prevMonthStr, allBudgets, transactions, memo);
  const prevTotalBudget = prevBudget.amount + prevCarryOver;

  const prevSpent = transactions
    .filter(
      (t) =>
        t.kind === "expense" &&
        t.category_id === categoryId &&
        t.happened_at.slice(0, 7) === prevMonthStr.slice(0, 7)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const prevRemaining = Math.max(0, prevTotalBudget - prevSpent);
  memo.set(key, prevRemaining);
  return prevRemaining;
}

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

export function sumBalance(transactions: TransactionRow[]) {
  return transactions.reduce((total, transaction) => {
    return total + (transaction.kind === "income" ? transaction.amount : -transaction.amount);
  }, 0);
}

export function sumSavingFlow(entries: SavingEntryRow[]) {
  return entries.reduce((total, entry) => total + (entry.entry_type === "deposit" ? entry.amount : -entry.amount), 0);
}

export function sumSavingBalance(savings: SavingRow[]) {
  return savings.reduce((total, saving) => total + saving.current_balance, 0);
}

export function buildWalletBalanceSummary(args: {
  transactions: TransactionRow[];
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
}) {
  const transactionBalance = sumBalance(args.transactions);
  const savingBalance = sumSavingBalance(args.savings);
  const availableBalance = transactionBalance;

  return {
    availableBalance,
    savingBalance,
    totalBalance: availableBalance + savingBalance
  };
}

export function getCurrentUserRole(memberships: WalletMemberRow[], walletId: string): WalletRole {
  return memberships.find((membership) => membership.wallet_id === walletId)?.role ?? "viewer";
}

export function buildWalletRoleSummary(memberRows: WalletMemberRow[]): WalletRoleSummary[] {
  const roles: WalletRole[] = ["owner", "editor", "viewer"];

  return roles.map((role) => ({
    role,
    count: memberRows.filter((member) => member.role === role).length
  }));
}

export function buildWalletSummaries(args: {
  memberships: WalletMemberRow[];
  wallets: WalletRow[];
  memberRows: WalletMemberRow[];
  transactions: TransactionRow[];
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  budgets: BudgetRow[];
  balancesByWallet?: Map<string, number>;
  month: string;
  locale?: AppLocale;
}) {
  const { memberships, wallets, memberRows, transactions, savings, savingEntries, budgets, balancesByWallet, month, locale = defaultLocale } = args;
  const currentRange = getMonthDateRange(month);
  const roleByWallet = new Map(memberships.map((membership) => [membership.wallet_id, membership.role]));
  const memberCountByWallet = new Map<string, number>();
  const transactionByWallet = new Map<string, TransactionRow[]>();
  const savingByWallet = new Map<string, SavingRow[]>();
  const savingEntriesByWallet = new Map<string, SavingEntryRow[]>();
  const budgetByWallet = new Map<string, BudgetRow[]>();

  memberRows.forEach((row) => {
    memberCountByWallet.set(row.wallet_id, (memberCountByWallet.get(row.wallet_id) ?? 0) + 1);
  });

  transactions.forEach((row) => {
    const current = transactionByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    transactionByWallet.set(row.wallet_id, current);
  });

  savings.forEach((row) => {
    const current = savingByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    savingByWallet.set(row.wallet_id, current);
  });

  savingEntries.forEach((row) => {
    const current = savingEntriesByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    savingEntriesByWallet.set(row.wallet_id, current);
  });

  budgets.forEach((row) => {
    const current = budgetByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    budgetByWallet.set(row.wallet_id, current);
  });

  return wallets
    .map((wallet) => {
      const walletTransactions = transactionByWallet.get(wallet.id) ?? [];
      const walletSavings = savingByWallet.get(wallet.id) ?? [];
      const walletSavingEntries = savingEntriesByWallet.get(wallet.id) ?? [];
      const monthExpenses = walletTransactions
        .filter((row) => row.kind === "expense" && row.happened_at.slice(0, 10) >= currentRange.start && row.happened_at.slice(0, 10) <= currentRange.end)
        .reduce((total, row) => total + row.amount, 0);
      const monthBudget = (budgetByWallet.get(wallet.id) ?? []).reduce((total, row) => total + row.amount, 0);
      const precomputedBalance = balancesByWallet?.get(wallet.id);
      const balances = precomputedBalance !== undefined
        ? {
            availableBalance: precomputedBalance,
            savingBalance: sumSavingBalance(walletSavings),
            totalBalance: precomputedBalance + sumSavingBalance(walletSavings)
          }
        : buildWalletBalanceSummary({
            transactions: walletTransactions,
            savings: walletSavings,
            savingEntries: walletSavingEntries
          });

      return {
        id: wallet.id,
        name: wallet.name,
        kind: wallet.kind,
        role: roleByWallet.get(wallet.id) ?? "viewer",
        members: memberCountByWallet.get(wallet.id) ?? 0,
        availableBalance: balances.availableBalance,
        savingBalance: balances.savingBalance,
        totalBalance: balances.totalBalance,
        spentThisMonth: monthExpenses,
        budgetThisMonth: monthBudget,
        currency: wallet.currency
      } satisfies WalletSummary;
    })
    .sort((left, right) => left.name.localeCompare(right.name, getLocaleTag(locale)));
}

export function buildRecentTransactions(
  transactions: TransactionRow[],
  categories: CategoryRow[],
  wallets: WalletRow[],
  locale: AppLocale = defaultLocale
) {
  const walletNameById = new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
  const walletCurrencyById = new Map(wallets.map((wallet) => [wallet.id, wallet.currency]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return transactions.map((transaction) => ({
    id: transaction.id,
    walletId: transaction.wallet_id,
    walletName: walletNameById.get(transaction.wallet_id) ?? translate(locale, "common.wallet"),
    walletCurrency: walletCurrencyById.get(transaction.wallet_id) ?? "IDR",
    category: transaction.category_id
      ? categoryById.get(transaction.category_id)?.name ?? translate(locale, "common.noCategory")
      : translate(locale, "common.noCategory"),
    categoryColor: transaction.category_id ? categoryById.get(transaction.category_id)?.color ?? "#595f3d" : "#595f3d",
    title:
      transaction.note ||
      (isBalanceAdjustmentSource(transaction.source)
        ? transaction.kind === "income"
          ? translate(locale, "transactions.balanceAdjustmentIncome")
          : translate(locale, "transactions.balanceAdjustmentExpense")
        : isSavingAdjustmentSource(transaction.source)
          ? transaction.kind === "income"
            ? translate(locale, "savings.withdraw")
            : translate(locale, "savings.deposit")
          : transaction.kind === "income"
            ? translate(locale, "transactions.kindIncome")
            : translate(locale, "transactions.kindExpense")),
    kind: transaction.kind,
    amount: transaction.amount,
    date: transaction.happened_at,
    splitLabel:
      transaction.split_type === "equal"
        ? translate(locale, "transactions.splitEqual")
        : transaction.split_type === "custom"
          ? translate(locale, "transactions.splitCustom")
          : "-"
  })) satisfies DashboardRecentTransaction[];
}

export function buildCategorySpend(
  transactions: TransactionRow[],
  categories: CategoryRow[],
  locale: AppLocale = defaultLocale
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const categorySpendMap = new Map<string, { value: number; color: string }>();

  transactions
    .filter((row) => row.kind === "expense")
    .forEach((transaction) => {
      const category = transaction.category_id ? categoryById.get(transaction.category_id) : null;
      const key = category?.name ?? translate(locale, "common.noCategory");
      const current = categorySpendMap.get(key) ?? { value: 0, color: category?.color ?? "#595f3d" };
      current.value += transaction.amount;
      categorySpendMap.set(key, current);
    });

  return [...categorySpendMap.entries()]
    .map(([name, item]) => ({ name, value: item.value, color: item.color }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 4) satisfies DashboardCategorySpend[];
}

export function buildDailyExpenses(transactions: TransactionRow[], month: string) {
  const expenseByDay = new Map<string, number>();
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const today = new Date().toISOString().slice(0, 10);

  transactions
    .filter((row) => row.kind === "expense")
    .forEach((row) => {
      const dateKey = row.happened_at.slice(0, 10);
      expenseByDay.set(dateKey, (expenseByDay.get(dateKey) ?? 0) + row.amount);
    });

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, "0")}`;

    return {
      day,
      dayLabel: String(day),
      date,
      amount: expenseByDay.get(date) ?? 0,
      isToday: date === today
    };
  }) satisfies DailyExpenseItem[];
}

export function buildDashboardOnboarding(args: {
  shell: ShellData;
  wallets: WalletRow[];
  hasManualTransaction: boolean;
  categories: CategoryRow[];
  budgets: BudgetRow[];
  savings: SavingRow[];
  locale?: AppLocale;
}) {
  const { shell, wallets, hasManualTransaction, categories, budgets, savings, locale = defaultLocale } = args;
  const persistedState = shell.onboardingState ?? "active";

  if (persistedState === "dismissed" || shell.onboardingDismissedAt) {
    return {
      isVisible: false,
      state: "dismissed",
      completedSteps: 0,
      totalSteps: 0,
      steps: []
    } satisfies DashboardOnboarding;
  }

  if (persistedState === "completed" || shell.onboardingCompletedAt) {
    return {
      isVisible: false,
      state: "completed",
      completedSteps: 0,
      totalSteps: 0,
      steps: []
    } satisfies DashboardOnboarding;
  }

  const hasWallet = wallets.length > 0;
  const primaryWalletHref = shell.primaryWalletId ? `/wallets/${shell.primaryWalletId}` : "/dashboard";
  const transactionsHref = shell.primaryWalletId ? `/wallets/${shell.primaryWalletId}/transactions` : "/dashboard";
  const categoriesHref = shell.primaryWalletId ? `/wallets/${shell.primaryWalletId}/categories` : "/dashboard";
  const budgetsHref = shell.primaryWalletId ? `/wallets/${shell.primaryWalletId}/budgets` : "/dashboard";
  const savingsHref = shell.primaryWalletId ? `/wallets/${shell.primaryWalletId}/savings` : "/dashboard";

  const hasCustomCategory = categories.length > 0;
  const hasBudget = budgets.length > 0;
  const hasSaving = savings.length > 0;
  const organizeComplete = hasCustomCategory || hasBudget;

  const organizeHref = hasCustomCategory ? budgetsHref : categoriesHref;
  const organizeCta = hasCustomCategory
    ? translate(locale, "dashboard.onboardingStep3CtaViewBudgets")
    : translate(locale, "dashboard.onboardingStep3CtaCreateCategory");

  const steps = [
    {
      id: "create_wallet",
      title: translate(locale, "dashboard.onboardingStep1Title"),
      description: translate(locale, "dashboard.onboardingStep1Description"),
      href: hasWallet ? primaryWalletHref : "/dashboard",
      ctaLabel: hasWallet
        ? translate(locale, "dashboard.onboardingStep1CtaView")
        : translate(locale, "dashboard.onboardingStep1CtaCreate"),
      isComplete: hasWallet
    },
    {
      id: "add_transaction",
      title: translate(locale, "dashboard.onboardingStep2Title"),
      description: translate(locale, "dashboard.onboardingStep2Description"),
      href: transactionsHref,
      ctaLabel: hasManualTransaction
        ? translate(locale, "dashboard.onboardingStep2CtaView")
        : translate(locale, "dashboard.onboardingStep2CtaCreate"),
      isComplete: hasManualTransaction
    },
    {
      id: "organize_wallet",
      title: translate(locale, "dashboard.onboardingStep3Title"),
      description: translate(locale, "dashboard.onboardingStep3Description"),
      href: organizeHref,
      ctaLabel: organizeCta,
      isComplete: organizeComplete
    },
    {
      id: "start_saving",
      title: translate(locale, "dashboard.onboardingStep4Title"),
      description: translate(locale, "dashboard.onboardingStep4Description"),
      href: savingsHref,
      ctaLabel: hasSaving
        ? translate(locale, "dashboard.onboardingStep4CtaView")
        : translate(locale, "dashboard.onboardingStep4CtaCreate"),
      isComplete: hasSaving
    }
  ] satisfies DashboardOnboardingStep[];

  const completedSteps = steps.filter((step) => step.isComplete).length;

  return {
    isVisible: true,
    state: completedSteps === steps.length ? "completed" : "active",
    completedSteps,
    totalSteps: steps.length,
    steps
  } satisfies DashboardOnboarding;
}

export function filterTransactionsByMonth(transactions: TransactionRow[], month: string) {
  return transactions.filter((transaction) => isSameMonth(transaction.happened_at, month));
}

function buildTransactionCreateCategories(categories: CategoryRow[], walletId: string) {
  return categories
    .filter((category) => category.wallet_id === walletId)
    .filter(
      (category) => (category.kind === "expense" || category.kind === "income") && !isBalanceAdjustmentCategory(category)
    )
    .filter(deduplicateById());
}

function buildTransactionCreateContext(args: {
  shell: ShellData;
  wallets: WalletRow[];
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
}): TransactionCreateContext | null {
  const { shell, wallets, memberships, categories } = args;
  const primaryWalletId = shell.primaryWalletId;

  if (!primaryWalletId) {
    return null;
  }

  const wallet = wallets.find((item) => item.id === primaryWalletId);

  if (!wallet) {
    return null;
  }

  const role = getCurrentUserRole(memberships, wallet.id);

  if (role !== "owner" && role !== "editor") {
    return null;
  }

  return {
    walletId: wallet.id,
    walletName: wallet.name,
    walletCurrency: wallet.currency,
    categories: buildTransactionCreateCategories(categories, wallet.id)
  } satisfies TransactionCreateContext;
}

export function buildTransactionListItems(
  transactions: TransactionRow[],
  categories: CategoryRow[],
  locale: AppLocale = defaultLocale
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return transactions.map((transaction) => ({
    id: transaction.id,
    kind: transaction.kind,
    source: transaction.source,
    categoryId: transaction.category_id,
    categoryName: transaction.category_id
      ? categoryById.get(transaction.category_id)?.name ?? translate(locale, "common.noCategory")
      : translate(locale, "common.noCategory"),
    categoryColor: transaction.category_id ? categoryById.get(transaction.category_id)?.color ?? "#595f3d" : "#595f3d",
    amount: transaction.amount,
    note: transaction.note,
    happenedAt: transaction.happened_at ?? new Date().toISOString(),
    splitType: transaction.split_type,
    splitLabel:
      transaction.split_type === "equal"
        ? translate(locale, "transactions.splitEqual")
        : transaction.split_type === "custom"
          ? translate(locale, "transactions.splitCustom")
          : "-",
    title:
      transaction.note ||
      (isBalanceAdjustmentSource(transaction.source)
        ? transaction.kind === "income"
          ? translate(locale, "transactions.balanceAdjustmentIncome")
          : translate(locale, "transactions.balanceAdjustmentExpense")
        : transaction.saving_entry_id
          ? transaction.kind === "income"
            ? translate(locale, "savings.withdraw")
            : translate(locale, "savings.deposit")
          : transaction.kind === "income"
            ? translate(locale, "transactions.kindIncome")
            : translate(locale, "transactions.kindExpense")),
    isRecurring: Boolean(transaction.recurring_transaction_id),
    isSavingLinked: Boolean(transaction.saving_entry_id),
    isBalanceAdjustment: isBalanceAdjustmentSource(transaction.source)
  }));
}

function matchesHistorySearch(
  transaction: ReturnType<typeof buildTransactionListItems>[number],
  search: string,
  localeTag: string,
  locale: AppLocale
) {
  if (!search) {
    return true;
  }

  const haystack = [
    transaction.title,
    transaction.note ?? "",
    transaction.categoryName,
    transaction.kind,
    transaction.kind === "expense" ? translate(locale, "transactions.kindExpense") : translate(locale, "transactions.kindIncome"),
    transaction.splitLabel,
    transaction.isRecurring ? translate(locale, "transactions.metaAutomatic") : "",
    transaction.isSavingLinked ? translate(locale, "transactions.metaSavings") : "",
    transaction.isBalanceAdjustment ? translate(locale, "transactions.metaAdjustment") : ""
  ]
    .join(" ")
    .toLocaleLowerCase(localeTag);

  return haystack.includes(search);
}

function compareHistoryKind(left: ReturnType<typeof buildTransactionListItems>[number], right: ReturnType<typeof buildTransactionListItems>[number], direction: SortDirection, localeTag: string) {
  const rank = direction === "asc"
    ? { income: 0, expense: 1 }
    : { expense: 0, income: 1 };
  const leftRank = rank[left.kind];
  const rightRank = rank[right.kind];

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return left.title.localeCompare(right.title, localeTag);
}

export function filterAndPaginateTransactionHistory(args: {
  transactions: ReturnType<typeof buildTransactionListItems>;
  searchQuery?: string;
  sortBy?: TransactionHistorySortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
  locale?: AppLocale;
}) {
  const {
    transactions,
    searchQuery = "",
    sortBy = "happened_at",
    sortDirection = "desc",
    page = 1,
    pageSize = 50,
    locale = defaultLocale
  } = args;
  const localeTag = getLocaleTag(locale);
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase(localeTag);

  const filteredTransactions = transactions.filter((transaction) => matchesHistorySearch(transaction, normalizedSearch, localeTag, locale));
  const sortedTransactions = [...filteredTransactions].sort((left, right) => {
    switch (sortBy) {
      case "amount": {
        const diff = sortDirection === "asc" ? left.amount - right.amount : right.amount - left.amount;
        if (diff !== 0) {
          return diff;
        }
        break;
      }
      case "category": {
        const diff = left.categoryName.localeCompare(right.categoryName, localeTag, { sensitivity: "base" });
        if (diff !== 0) {
          return sortDirection === "asc" ? diff : -diff;
        }
        break;
      }
      case "kind": {
        const diff = compareHistoryKind(left, right, sortDirection, localeTag);
        if (diff !== 0) {
          return diff;
        }
        break;
      }
      case "happened_at":
      default: {
        const diff = sortDirection === "asc"
          ? left.happenedAt.localeCompare(right.happenedAt)
          : right.happenedAt.localeCompare(left.happenedAt);
        if (diff !== 0) {
          return diff;
        }
        break;
      }
    }

    return right.happenedAt.localeCompare(left.happenedAt) || left.id.localeCompare(right.id);
  });

  const totalCount = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(start, start + pageSize);

  return {
    transactions: paginatedTransactions,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };
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

export function buildSavingContributionItems(args: {
  walletKind: WalletRow["kind"];
  entries: SavingEntryRow[];
  memberRows: WalletMemberRow[];
  profileMap: Map<string, { full_name: string | null; email: string | null }>;
  locale?: AppLocale;
}) {
  const { walletKind, entries, memberRows, profileMap, locale = defaultLocale } = args;

  if (walletKind !== "shared") {
    return [] satisfies SavingContributionItem[];
  }

  const totals = new Map<string, number>();

  entries
    .filter((entry) => entry.entry_type === "deposit" && entry.member_user_id)
    .forEach((entry) => {
      const memberUserId = entry.member_user_id as string;
      totals.set(memberUserId, (totals.get(memberUserId) ?? 0) + entry.amount);
    });

  return memberRows
    .map((member) => {
      const profile = profileMap.get(member.user_id);
      return {
        memberUserId: member.user_id,
        memberName: profile?.full_name || profile?.email || member.user_id,
        totalContributed: totals.get(member.user_id) ?? 0
      } satisfies SavingContributionItem;
    })
    .filter((item) => item.totalContributed > 0)
    .sort(
      (left, right) =>
        right.totalContributed - left.totalContributed ||
        left.memberName.localeCompare(right.memberName, getLocaleTag(locale))
    );
}

export function buildSavingListItems(args: {
  wallet: WalletRow;
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  memberRows: WalletMemberRow[];
  profileMap: Map<string, { full_name: string | null; email: string | null }>;
  locale?: AppLocale;
}) {
  const entriesBySaving = new Map<string, SavingEntryRow[]>();

  args.savingEntries.forEach((entry) => {
    const current = entriesBySaving.get(entry.saving_id) ?? [];
    current.push(entry);
    entriesBySaving.set(entry.saving_id, current);
  });

  return args.savings.map((saving) => {
    const rawEntries = entriesBySaving.get(saving.id) ?? [];
    const entries = rawEntries
      .map((entry) => {
        const profile = entry.member_user_id ? args.profileMap.get(entry.member_user_id) : null;

        return {
          id: entry.id,
          type: entry.entry_type,
          amount: entry.amount,
          happenedAt: entry.happened_at,
          note: entry.note,
          memberUserId: entry.member_user_id,
          memberName: profile?.full_name || profile?.email || null
        } satisfies SavingEntryListItem;
      })
      .sort((left, right) => right.happenedAt.localeCompare(left.happenedAt));

    const progressRatio = saving.target_amount && saving.target_amount > 0 ? Math.min((saving.current_balance / saving.target_amount) * 100, 100) : 0;

    return {
      id: saving.id,
      name: saving.name,
      currentBalance: saving.current_balance,
      targetAmount: saving.target_amount,
      progressRatio,
      progressLabel:
        saving.target_amount && saving.target_amount > 0
          ? translate(args.locale ?? defaultLocale, "savings.progressLabel", { percent: Math.round(progressRatio) })
          : translate(args.locale ?? defaultLocale, "savings.noTarget"),
      isArchived: saving.is_archived,
      entries,
      contributions: buildSavingContributionItems({
        walletKind: args.wallet.kind,
        entries: rawEntries,
        memberRows: args.memberRows,
        profileMap: args.profileMap,
        locale: args.locale
      })
    } satisfies SavingListItem;
  });
}

export function buildBudgetProgressItems(args: {
  budgets: BudgetRow[];
  allBudgets: BudgetRow[];
  transactions: TransactionRow[];
  categories: CategoryRow[];
  month: string;
  locale?: AppLocale;
  currency?: string;
}) {
  const { budgets, allBudgets, transactions, categories, month, currency = "IDR" } = args;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const carryOverMemo = new Map<string, number>();

  return budgets
    .filter((budget) => isSameMonth(budget.month_start, month))
    .map((budget) => {
      const used = transactions
        .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id && isSameMonth(transaction.happened_at, month))
        .reduce((total, transaction) => total + transaction.amount, 0);

      const carryOverAmount = calculateCarryOver(budget.category_id, month, allBudgets, transactions, carryOverMemo);
      const totalBudget = budget.amount + carryOverAmount;

      return {
        id: budget.id,
        categoryId: budget.category_id,
        categoryName: categoryById.get(budget.category_id)?.name ?? translate(args.locale ?? defaultLocale, "common.noCategory"),
        monthStart: budget.month_start,
        amount: budget.amount,
        carryOverEnabled: budget.carry_over_enabled,
        carryOverAmount,
        totalBudget,
        used,
        ratio: totalBudget > 0 ? Math.min((used / totalBudget) * 100, 100) : 0,
        usageLabel: describeBudgetUsage(used, totalBudget, currency)
      } satisfies BudgetProgressItem;
    });
}

export function createDashboardData(args: {
  shell: ShellData;
  memberships: WalletMemberRow[];
  wallets: WalletRow[];
  memberRows: WalletMemberRow[];
  budgets: BudgetRow[];
  recentTransactions: TransactionRow[];
  monthTransactions: TransactionRow[];
  balancesByWallet?: Map<string, number>;
  hasManualTransaction?: boolean;
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  categories: CategoryRow[];
  splits: TransactionSplitRow[];
  month: string;
  locale?: AppLocale;
}) {
  const {
    shell,
    memberships,
    wallets,
    memberRows,
    budgets,
    recentTransactions,
    monthTransactions,
    balancesByWallet,
    hasManualTransaction,
    savings,
    savingEntries,
    categories,
    splits,
    month,
    locale = defaultLocale
  } = args;
  const walletSummaries = buildWalletSummaries({
    memberships,
    wallets,
    memberRows,
    transactions: monthTransactions,
    savings,
    savingEntries,
    budgets,
    balancesByWallet,
    month,
    locale
  });
  const currentMonthTransactions = monthTransactions;

  return {
    shell,
    onboarding: buildDashboardOnboarding({
      shell,
      wallets,
      hasManualTransaction: hasManualTransaction ?? monthTransactions.some((row) => row.source === "manual"),
      categories,
      budgets,
      savings,
      locale
    }),
    createTransactionContext: buildTransactionCreateContext({
      shell,
      wallets,
      memberships,
      categories
    }),
    totalAvailableBalance: walletSummaries.reduce((total, wallet) => total + wallet.availableBalance, 0),
    totalAvailableBudget: walletSummaries.reduce(
      (total, wallet) => total + (wallet.budgetThisMonth > 0 ? wallet.budgetThisMonth - wallet.spentThisMonth : 0),
      0
    ),
    totalSavingBalance: walletSummaries.reduce((total, wallet) => total + wallet.savingBalance, 0),
    totalBalance: walletSummaries.reduce((total, wallet) => total + wallet.totalBalance, 0),
    totalExpenseThisMonth: currentMonthTransactions.filter((row) => row.kind === "expense").reduce((total, row) => total + row.amount, 0),
    totalIncomeThisMonth: currentMonthTransactions.filter((row) => row.kind === "income").reduce((total, row) => total + row.amount, 0),
    outstandingSplit: splits.reduce((total, row) => total + Math.max(row.owed_amount - row.paid_amount, 0), 0),
    wallets: walletSummaries,
    recentTransactions: buildRecentTransactions(recentTransactions, categories, wallets, locale),
    categorySpend: buildCategorySpend(currentMonthTransactions, categories, locale),
    dailyExpenses: buildDailyExpenses(currentMonthTransactions, month)
  } satisfies DashboardData;
}

export function createWalletOverviewData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  memberRows: WalletMemberRow[];
  categories: CategoryRow[];
  budgets: BudgetRow[];
  transactions: TransactionRow[];
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  templates: TemplateRow[];
  month: string;
  locale?: AppLocale;
}) {
  const { shell, wallet, memberships, memberRows, categories, budgets, transactions, savings, savingEntries, templates, month, locale = defaultLocale } = args;
  const [summary] = buildWalletSummaries({
    memberships,
    wallets: [wallet],
    memberRows,
    transactions,
    savings,
    savingEntries,
    budgets,
    month,
    locale
  });

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    wallet: summary,
    hasTransactions: transactions.length > 0,
    transactionCount: transactions.length,
    categoryCount: categories.length,
    activeBudgetCount: budgets.length,
    templateCount: templates.length,
    roleSummary: buildWalletRoleSummary(memberRows)
  } satisfies WalletOverviewData;
}

export function createTransactionsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  transactions: TransactionRow[];
  currentAvailableBalance: number;
  selectedMonth: string;
  locale?: AppLocale;
}) {
  const { shell, wallet, memberships, categories, transactions, currentAvailableBalance, selectedMonth, locale = defaultLocale } = args;
  const formCategories = buildTransactionCreateCategories(categories, wallet.id);
  const walletTransactions = transactions.filter((transaction) => transaction.wallet_id === wallet.id);
  const filteredTransactions = filterTransactionsByMonth(walletTransactions, selectedMonth);

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    walletCurrency: wallet.currency,
    currentAvailableBalance,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: formCategories,
    transactions: buildTransactionListItems(filteredTransactions, categories, locale).slice(0, 8)
  } satisfies TransactionsPageData;
}

export function createTransactionHistoryPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  transactions: TransactionRow[];
  selectedMonth: string;
  locale?: AppLocale;
  searchQuery?: string;
  sortBy?: TransactionHistorySortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}) {
  const {
    shell,
    wallet,
    memberships,
    categories,
    transactions,
    selectedMonth,
    locale = defaultLocale,
    searchQuery = "",
    sortBy = "happened_at",
    sortDirection = "desc",
    page = 1,
    pageSize = 50
  } = args;
  const formCategories = categories
    .filter(
      (category) => (category.kind === "expense" || category.kind === "income") && !isBalanceAdjustmentCategory(category)
    )
    .filter(deduplicateById());
  const historyTransactions = filterAndPaginateTransactionHistory({
    transactions: buildTransactionListItems(transactions, categories, locale),
    searchQuery,
    sortBy,
    sortDirection,
    page,
    pageSize,
    locale
  });

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: formCategories,
    transactions: historyTransactions.transactions,
    searchQuery,
    sortBy,
    sortDirection,
    currentPage: historyTransactions.currentPage,
    totalPages: historyTransactions.totalPages,
    totalCount: historyTransactions.totalCount,
    pageSize: historyTransactions.pageSize,
    hasPreviousPage: historyTransactions.hasPreviousPage,
    hasNextPage: historyTransactions.hasNextPage
  } satisfies TransactionHistoryPageData;
}

export function createBudgetsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  budgets: BudgetRow[];
  allBudgets: BudgetRow[];
  transactions: TransactionRow[];
  selectedMonth: string;
}) {
  const { shell, wallet, memberships, categories, budgets, allBudgets, transactions, selectedMonth } = args;
  const expenseCategories = categories.filter((category) => category.kind === "expense" && !isBalanceAdjustmentCategory(category));
  const walletTransactions = transactions.filter((transaction) => transaction.wallet_id === wallet.id);

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: expenseCategories,
    budgets: buildBudgetProgressItems({
      budgets,
      allBudgets,
      transactions: walletTransactions,
      categories: expenseCategories,
      month: selectedMonth,
      currency: wallet.currency
    })
  } satisfies BudgetsPageData;
}

export function createCategoriesPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
}) {
  const { shell, wallet, memberships, categories } = args;

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    categories: categories.filter((category) => category.wallet_id === wallet.id)
  } satisfies CategoriesPageData;
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

export function createSavingsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  memberRows: WalletMemberRow[];
  profileMap: Map<string, { full_name: string | null; email: string | null }>;
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  walletSummary: WalletSummary;
  locale?: AppLocale;
}) {
  const { shell, wallet, memberships, memberRows, profileMap, savings, savingEntries, walletSummary, locale = defaultLocale } = args;

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    walletKind: wallet.kind,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    walletSummary,
    members: memberRows,
    memberOptions: memberRows.map((member) => {
      const profile = profileMap.get(member.user_id);
      return {
        userId: member.user_id,
        name: profile?.full_name || profile?.email || member.user_id
      };
    }),
    savings: buildSavingListItems({
      wallet,
      savings: savings.filter((saving) => saving.wallet_id === wallet.id),
      savingEntries: savingEntries.filter((entry) => entry.wallet_id === wallet.id),
      memberRows,
      profileMap,
      locale
    })
  } satisfies SavingsPageData;
}

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
