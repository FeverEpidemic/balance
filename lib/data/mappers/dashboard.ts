import { defaultLocale, translate, type AppLocale } from "@/lib/i18n";
import type {
  BudgetRow,
  CategoryRow,
  DailyExpenseItem,
  DashboardOnboarding,
  DashboardOnboardingStep,
  DashboardCategorySpend,
  DashboardData,
  SavingEntryRow,
  SavingRow,
  ShellData,
  TransactionRow,
  TransactionSplitRow,
  WalletDashboardBreakdown,
  WalletMemberRow,
  WalletRow
} from "@/lib/data/types";
import { buildWalletSummaries } from "@/lib/data/mappers/wallets";
import {
  buildRecentTransactions,
  buildTransactionCreateContext,
  buildAllWalletContexts
} from "@/lib/data/mappers/transactions";

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
    .slice(0, 4) satisfies Omit<DashboardCategorySpend, "walletId">[];
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
  }) satisfies Omit<DailyExpenseItem, "walletId">[];
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

function buildWalletBreakdown(args: {
  walletId: string;
  memberships: WalletMemberRow[];
  wallets: WalletRow[];
  memberRows: WalletMemberRow[];
  budgets: BudgetRow[];
  monthTransactions: TransactionRow[];
  recentTransactions: TransactionRow[];
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  categories: CategoryRow[];
  splits: TransactionSplitRow[];
  balancesByWallet?: Map<string, number>;
  month: string;
  locale: AppLocale;
}): WalletDashboardBreakdown {
  const {
    walletId,
    memberships,
    wallets,
    memberRows,
    budgets,
    monthTransactions,
    recentTransactions,
    savings,
    savingEntries,
    categories,
    splits,
    balancesByWallet,
    month,
    locale
  } = args;

  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) {
    return {
      totalAvailableBalance: 0,
      totalAvailableBudget: 0,
      totalSavingBalance: 0,
      totalBalance: 0,
      totalExpenseThisMonth: 0,
      totalIncomeThisMonth: 0,
      outstandingSplit: 0,
      categorySpend: [],
      dailyExpenses: [],
      recentTransactions: []
    };
  }

  const walletMonthTransactions = monthTransactions.filter((tx) => tx.wallet_id === walletId);
  const walletRecentTransactions = recentTransactions.filter((tx) => tx.wallet_id === walletId);
  const walletSplits = splits.filter((s) => s.wallet_id === walletId);
  const walletBudgets = budgets.filter((b) => b.wallet_id === walletId);
  const walletCategories = categories.filter((c) => c.wallet_id === walletId);
  const walletSavings = savings.filter((s) => s.wallet_id === walletId);
  const walletSavingEntries = savingEntries.filter((s) => s.wallet_id === walletId);
  const walletMemberRows = memberRows.filter((m) => m.wallet_id === walletId);

  const [summary] = buildWalletSummaries({
    memberships,
    wallets: [wallet],
    memberRows: walletMemberRows,
    transactions: walletMonthTransactions,
    savings: walletSavings,
    savingEntries: walletSavingEntries,
    budgets: walletBudgets,
    balancesByWallet,
    month,
    locale
  });

  return {
    totalAvailableBalance: summary.availableBalance,
    totalAvailableBudget: summary.budgetThisMonth > 0 ? summary.budgetThisMonth - summary.spentThisMonth : 0,
    totalSavingBalance: summary.savingBalance,
    totalBalance: summary.totalBalance,
    totalExpenseThisMonth: walletMonthTransactions.filter((tx) => tx.kind === "expense").reduce((sum, tx) => sum + tx.amount, 0),
    totalIncomeThisMonth: walletMonthTransactions.filter((tx) => tx.kind === "income").reduce((sum, tx) => sum + tx.amount, 0),
    outstandingSplit: walletSplits.reduce((sum, s) => sum + Math.max(s.owed_amount - s.paid_amount, 0), 0),
    categorySpend: buildCategorySpend(walletMonthTransactions, walletCategories, locale).map((cs) => ({
      ...cs,
      walletId
    })),
    dailyExpenses: buildDailyExpenses(walletMonthTransactions, month).map((de) => ({
      ...de,
      walletId
    })),
    recentTransactions: buildRecentTransactions(walletRecentTransactions, walletCategories, [wallet], locale)
  };
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
    allWalletContexts: buildAllWalletContexts({
      wallets,
      memberships,
      categories
    }),
    walletBreakdowns: Object.fromEntries(
      wallets.map((wallet) => [
        wallet.id,
        buildWalletBreakdown({
          walletId: wallet.id,
          memberships,
          wallets,
          memberRows,
          budgets,
          monthTransactions,
          recentTransactions,
          savings,
          savingEntries,
          categories,
          splits,
          balancesByWallet,
          month,
          locale
        })
      ])
    ),
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
    categorySpend: buildCategorySpend(currentMonthTransactions, categories, locale).map((cs) => ({
      ...cs,
      walletId: ""
    })),
    dailyExpenses: buildDailyExpenses(currentMonthTransactions, month).map((de) => ({
      ...de,
      walletId: ""
    }))
  } satisfies DashboardData;
}
