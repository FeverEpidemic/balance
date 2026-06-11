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
  TransactionsPageData,
  WalletMemberRow,
  WalletOverviewData,
  WalletRole,
  WalletRoleSummary,
  WalletRow,
  WalletSummary
} from "@/lib/data/types";

function isSameMonth(dateValue: string, month: string) {
  return dateValue.slice(0, 7) === month;
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
  month: string;
  locale?: AppLocale;
}) {
  const { memberships, wallets, memberRows, transactions, savings, savingEntries, budgets, month, locale = defaultLocale } = args;
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
      const balances = buildWalletBalanceSummary({
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
        budgetThisMonth: monthBudget
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
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return transactions.map((transaction) => ({
    id: transaction.id,
    walletId: transaction.wallet_id,
    walletName: walletNameById.get(transaction.wallet_id) ?? translate(locale, "common.wallet"),
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
  allTransactions: TransactionRow[];
  locale?: AppLocale;
}) {
  const { shell, wallets, allTransactions, locale = defaultLocale } = args;
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
  const hasManualTransaction = allTransactions.some((transaction) => transaction.source === "manual");
  const transactionsHref = shell.primaryWalletId ? `/wallets/${shell.primaryWalletId}/transactions` : "/wallets";
  const reviewComplete = hasWallet && hasManualTransaction;

  const steps = [
    {
      id: "create_wallet",
      title: translate(locale, "dashboard.onboardingStep1Title"),
      description: translate(locale, "dashboard.onboardingStep1Description"),
      href: "/wallets",
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
      id: "review_dashboard",
      title: translate(locale, "dashboard.onboardingStep3Title"),
      description: translate(locale, "dashboard.onboardingStep3Description"),
      href: "#ringkasan-finansial",
      ctaLabel: translate(locale, "dashboard.onboardingStep3Cta"),
      isComplete: reviewComplete
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
  transactions: TransactionRow[];
  categories: CategoryRow[];
  month: string;
  locale?: AppLocale;
}) {
  const { budgets, transactions, categories, month } = args;
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return budgets
    .filter((budget) => isSameMonth(budget.month_start, month))
    .map((budget) => {
      const used = transactions
        .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id && isSameMonth(transaction.happened_at, month))
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        id: budget.id,
        categoryId: budget.category_id,
        categoryName: categoryById.get(budget.category_id)?.name ?? translate(args.locale ?? defaultLocale, "common.noCategory"),
        monthStart: budget.month_start,
        amount: budget.amount,
        used,
        ratio: budget.amount > 0 ? Math.min((used / budget.amount) * 100, 100) : 0,
        usageLabel: describeBudgetUsage(used, budget.amount)
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
  allTransactions: TransactionRow[];
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
    allTransactions,
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
    transactions: allTransactions,
    savings,
    savingEntries,
    budgets,
    month,
    locale
  });
  const currentMonthTransactions = filterTransactionsByMonth(allTransactions, month);

  return {
    shell,
    onboarding: buildDashboardOnboarding({
      shell,
      wallets,
      allTransactions,
      locale
    }),
    totalAvailableBalance: walletSummaries.reduce((total, wallet) => total + wallet.availableBalance, 0),
    totalSavingBalance: walletSummaries.reduce((total, wallet) => total + wallet.savingBalance, 0),
    totalBalance: walletSummaries.reduce((total, wallet) => total + wallet.totalBalance, 0),
    totalExpenseThisMonth: currentMonthTransactions.filter((row) => row.kind === "expense").reduce((total, row) => total + row.amount, 0),
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
  selectedMonth: string;
  locale?: AppLocale;
}) {
  const { shell, wallet, memberships, categories, transactions, selectedMonth, locale = defaultLocale } = args;
  const formCategories = categories.filter(
    (category) => (category.kind === "expense" || category.kind === "income") && !isBalanceAdjustmentCategory(category)
  );
  const walletTransactions = transactions.filter((transaction) => transaction.wallet_id === wallet.id);
  const filteredTransactions = filterTransactionsByMonth(walletTransactions, selectedMonth);

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
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
}) {
  const { shell, wallet, memberships, categories, transactions, selectedMonth, locale = defaultLocale } = args;
  const formCategories = categories.filter(
    (category) => (category.kind === "expense" || category.kind === "income") && !isBalanceAdjustmentCategory(category)
  );

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: formCategories,
    transactions: buildTransactionListItems(transactions, categories, locale)
  } satisfies TransactionHistoryPageData;
}

export function createBudgetsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  budgets: BudgetRow[];
  transactions: TransactionRow[];
  selectedMonth: string;
}) {
  const { shell, wallet, memberships, categories, budgets, transactions, selectedMonth } = args;
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
      transactions: walletTransactions,
      categories: expenseCategories,
      month: selectedMonth
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

export function buildMonthlyReport(transactions: TransactionRow[], locale: AppLocale = defaultLocale) {
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
    .slice(-6)
    .map(([month, value]) => ({
      month,
      label: new Intl.DateTimeFormat(getLocaleTag(locale), { month: "short", timeZone: "UTC" }).format(
        new Date(`${month}-01T00:00:00.000Z`)
      ),
      income: value.income,
      expense: value.expense
    }));
}
