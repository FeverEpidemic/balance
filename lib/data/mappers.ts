// Row-to-view-model mappers, split by domain in lib/data/mappers/.
// This file re-exports the public API so existing imports keep working.

export {
  filterTransactionsByMonth
} from "@/lib/data/mappers/shared";
export {
  sumBalance,
  sumSavingFlow,
  sumSavingBalance,
  buildWalletBalanceSummary,
  getCurrentUserRole,
  buildWalletRoleSummary,
  buildWalletSummaries,
  createWalletOverviewData,
  createCategoriesPageData
} from "@/lib/data/mappers/wallets";
export {
  buildRecentTransactions,
  buildTransactionListItems,
  filterAndPaginateTransactionHistory,
  createTransactionsPageData,
  createTransactionHistoryPageData
} from "@/lib/data/mappers/transactions";
export {
  buildBudgetProgressItems,
  createBudgetsPageData
} from "@/lib/data/mappers/budgets";
export {
  buildSavingContributionItems,
  buildSavingListItems,
  createSavingsPageData
} from "@/lib/data/mappers/savings";
export {
  buildRecurringTransactionListItems,
  createRecurringTransactionsPageData
} from "@/lib/data/mappers/recurring";
export {
  buildCategorySpend,
  buildDailyExpenses,
  buildDashboardOnboarding,
  createDashboardData
} from "@/lib/data/mappers/dashboard";
export {
  buildMonthlyReport
} from "@/lib/data/mappers/reports";
