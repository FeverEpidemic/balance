import "server-only";
import { getCurrentMonthKey } from "@/lib/finance";
import { getPeriodRange, type RekapPeriod } from "@/lib/chat-auth";
import { queryBudgets, queryCategories, queryCurrentUserWalletIds, queryTransactions, queryWallets } from "@/lib/data/queries";
import type { BudgetRow, CategoryRow, TransactionRow, WalletRow } from "@/lib/data/types";

export type AiWalletOption = {
  id: string;
  name: string;
  kind: WalletRow["kind"];
};

export type AiFinancialRecap = {
  period: RekapPeriod;
  range: { start: string; end: string };
  walletId: string | null;
  walletLabel: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  topExpenseCategories: Array<{ categoryId: string | null; categoryName: string; total: number }>;
  perWallet: Array<{ walletId: string; walletName: string; totalIncome: number; totalExpense: number; net: number; transactionCount: number }>;
};

export type AiBudgetStatus = {
  walletId: string;
  walletName: string;
  month: string;
  totalBudget: number;
  totalSpent: number;
  usagePercent: number;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    budget: number;
    spent: number;
    remaining: number;
    usagePercent: number;
  }>;
};

export type AiTransactionItem = {
  id: string;
  walletId: string;
  walletName: string;
  amount: number;
  kind: TransactionRow["kind"];
  happenedAt: string;
  note: string | null;
  categoryName: string;
};

async function getAccessibleWallets(userId: string) {
  const memberships = await queryCurrentUserWalletIds(userId);
  const walletIds = memberships.map((item) => item.wallet_id);
  const wallets = await queryWallets(walletIds);

  return {
    walletIds,
    wallets
  };
}

function assertAccessibleWallet(walletIds: string[], walletId: string | null | undefined) {
  if (walletId && !walletIds.includes(walletId)) {
    throw new Error("WALLET_ACCESS_DENIED");
  }
}

function buildCategoryMap(categories: CategoryRow[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

function buildWalletMap(wallets: WalletRow[]) {
  return new Map(wallets.map((wallet) => [wallet.id, wallet]));
}

export async function getAiWalletOptions(userId: string): Promise<AiWalletOption[]> {
  const { wallets } = await getAccessibleWallets(userId);

  return wallets.map((wallet) => ({
    id: wallet.id,
    name: wallet.name,
    kind: wallet.kind
  }));
}

export async function getFinancialRecapForUser(userId: string, period: RekapPeriod, walletId?: string | null): Promise<AiFinancialRecap> {
  const { walletIds, wallets } = await getAccessibleWallets(userId);
  assertAccessibleWallet(walletIds, walletId);

  const targetWalletIds = walletId ? [walletId] : walletIds;
  const [allTransactions, categories] = await Promise.all([
    queryTransactions(targetWalletIds),
    queryCategories(targetWalletIds)
  ]);

  const range = getPeriodRange(period);
  const startAt = Date.parse(range.start);
  const endAt = Date.parse(range.end);
  const periodTransactions = allTransactions.filter((transaction) => {
    const happenedAt = Date.parse(transaction.happened_at);
    return Number.isFinite(happenedAt) && happenedAt >= startAt && happenedAt <= endAt;
  });

  const categoryMap = buildCategoryMap(categories);
  const walletMap = buildWalletMap(wallets);
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = new Map<string, { categoryName: string; total: number }>();
  const walletTotals = new Map<string, { totalIncome: number; totalExpense: number; transactionCount: number }>();

  targetWalletIds.forEach((id) => {
    walletTotals.set(id, { totalIncome: 0, totalExpense: 0, transactionCount: 0 });
  });

  periodTransactions.forEach((transaction) => {
    const currentWallet = walletTotals.get(transaction.wallet_id);

    if (currentWallet) {
      currentWallet.transactionCount += 1;
    }

    if (transaction.kind === "income") {
      totalIncome += transaction.amount;
      if (currentWallet) {
        currentWallet.totalIncome += transaction.amount;
      }
      return;
    }

    totalExpense += transaction.amount;

    if (currentWallet) {
      currentWallet.totalExpense += transaction.amount;
    }

    if (!transaction.category_id) {
      return;
    }

    const categoryName = categoryMap.get(transaction.category_id)?.name ?? "Tanpa kategori";
    const existing = categoryTotals.get(transaction.category_id);

    if (existing) {
      existing.total += transaction.amount;
      return;
    }

    categoryTotals.set(transaction.category_id, {
      categoryName,
      total: transaction.amount
    });
  });

  return {
    period,
    range,
    walletId: walletId ?? null,
    walletLabel: walletId ? walletMap.get(walletId)?.name ?? "Wallet dipilih" : "Semua wallet",
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    transactionCount: periodTransactions.length,
    topExpenseCategories: Array.from(categoryTotals.entries())
      .map(([categoryId, value]) => ({ categoryId, ...value }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    perWallet: Array.from(walletTotals.entries())
      .map(([id, value]) => ({
        walletId: id,
        walletName: walletMap.get(id)?.name ?? "Wallet",
        totalIncome: value.totalIncome,
        totalExpense: value.totalExpense,
        net: value.totalIncome - value.totalExpense,
        transactionCount: value.transactionCount
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount)
  };
}

export async function getRecentTransactionsForUser(userId: string, walletId?: string | null, limit = 8): Promise<AiTransactionItem[]> {
  const { walletIds, wallets } = await getAccessibleWallets(userId);
  assertAccessibleWallet(walletIds, walletId);
  const targetWalletIds = walletId ? [walletId] : walletIds;
  const [transactions, categories] = await Promise.all([
    queryTransactions(targetWalletIds, limit),
    queryCategories(targetWalletIds)
  ]);
  const walletMap = buildWalletMap(wallets);
  const categoryMap = buildCategoryMap(categories);

  return transactions.slice(0, limit).map((transaction) => ({
    id: transaction.id,
    walletId: transaction.wallet_id,
    walletName: walletMap.get(transaction.wallet_id)?.name ?? "Wallet",
    amount: transaction.amount,
    kind: transaction.kind,
    happenedAt: transaction.happened_at,
    note: transaction.note,
    categoryName: transaction.category_id ? categoryMap.get(transaction.category_id)?.name ?? "Tanpa kategori" : "Tanpa kategori"
  }));
}

function groupSpentByCategory(transactions: TransactionRow[]) {
  const totals = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (transaction.kind !== "expense" || !transaction.category_id) {
      return;
    }

    totals.set(transaction.category_id, (totals.get(transaction.category_id) ?? 0) + transaction.amount);
  });

  return totals;
}

function buildBudgetCategories(budgets: BudgetRow[], categories: CategoryRow[], spendByCategory: Map<string, number>) {
  const categoryMap = buildCategoryMap(categories);

  return budgets
    .map((budget) => {
      const spent = spendByCategory.get(budget.category_id) ?? 0;
      const categoryName = categoryMap.get(budget.category_id)?.name ?? "Tanpa kategori";
      const usagePercent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

      return {
        categoryId: budget.category_id,
        categoryName,
        budget: budget.amount,
        spent,
        remaining: budget.amount - spent,
        usagePercent
      };
    })
    .sort((a, b) => b.usagePercent - a.usagePercent);
}

export async function getBudgetStatusForUser(userId: string, walletId: string): Promise<AiBudgetStatus> {
  const { walletIds, wallets } = await getAccessibleWallets(userId);
  assertAccessibleWallet(walletIds, walletId);
  const month = getCurrentMonthKey();
  const [budgets, categories, transactions] = await Promise.all([
    queryBudgets([walletId], month),
    queryCategories([walletId]),
    queryTransactions([walletId])
  ]);

  const spendByCategory = groupSpentByCategory(
    transactions.filter((transaction) => transaction.happened_at.startsWith(month))
  );
  const categoriesWithUsage = buildBudgetCategories(budgets, categories, spendByCategory);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = categoriesWithUsage.reduce((sum, category) => sum + category.spent, 0);

  return {
    walletId,
    walletName: wallets.find((wallet) => wallet.id === walletId)?.name ?? "Wallet",
    month,
    totalBudget,
    totalSpent,
    usagePercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    categories: categoriesWithUsage
  };
}
