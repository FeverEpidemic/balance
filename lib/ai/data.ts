import "server-only";
import { getCurrentMonthKey } from "@/lib/finance";
import { invalidateAiInsightCache, invalidateWalletReadCaches } from "@/lib/data/cache";
import { getPeriodRange, getPreviousPeriodRange, type RekapPeriod } from "@/lib/chat-auth";
import { queryBudgets, queryCategories, queryCurrentUserWalletIds, queryTransactions, queryWallets } from "@/lib/data/queries";
import type { BudgetRow, CategoryRow, TransactionKind, TransactionRow, WalletRow } from "@/lib/data/types";
import { consumeTransactionRateLimit } from "@/lib/rate-limit";
import { checkFreeTransactionLimit, incrementTransactionCount } from "@/lib/transaction-limits";
import { createClient } from "@/lib/supabase/server";
import { dateStringToISO, getTodayDateString, isValidDateString } from "@/lib/utils";
import { getActionTranslator, getWalletMemberUserIds, revalidateWalletPaths } from "@/app/actions/_shared";

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
    budgetId: string;
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

export type AiCategoryOption = {
  id: string;
  walletId: string;
  walletName: string;
  name: string;
  kind: CategoryRow["kind"];
  color: string;
  isSystem: boolean;
};

export type AiCreateTransactionParams = {
  walletId: string;
  kind: TransactionKind;
  amount: number;
  categoryId?: string | null;
  categoryName?: string | null;
  note?: string | null;
  happenedAt?: string | null;
};

export type AiCreateTransactionResult = {
  ok: boolean;
  code?: string;
  message: string;
  transaction?: {
    id: string;
    walletId: string;
    walletName: string;
    kind: TransactionKind;
    amount: number;
    happenedAt: string;
    categoryId: string | null;
    categoryName: string;
    note: string | null;
    source: "manual";
  };
};

export type AiCategoryFocus = {
  categoryId: string;
  categoryName: string;
  totalExpense: number;
  transactionCount: number;
  walletNames: string[];
  recentNotes: string[];
  budget?: {
    month: string;
    amount: number;
    spent: number;
    remaining: number;
    usagePercent: number;
    status: "safe" | "warning" | "over";
  } | null;
  previousPeriod?: {
    range: { start: string; end: string };
    totalExpense: number;
    transactionCount: number;
    deltaAmount: number;
    deltaPercent: number | null;
  } | null;
};

async function getAccessibleWallets(userId: string) {
  const memberships = await queryCurrentUserWalletIds(userId);
  const walletIds = memberships.map((item) => item.wallet_id);
  const wallets = await queryWallets(walletIds);

  return {
    memberships,
    walletIds,
    wallets
  };
}

function assertAccessibleWallet(walletIds: string[], walletId: string | null | undefined) {
  if (walletId && !walletIds.includes(walletId)) {
    throw new Error("WALLET_ACCESS_DENIED");
  }
}

/**
 * UUID v4 regex pattern for checking if a string is a valid UUID.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a wallet ID that may be a UUID or a human-readable name.
 * If the input is already a valid UUID, return it as-is.
 * Otherwise, try to match it against the user's accessible wallets by name (case-insensitive, normalized).
 * Returns the matched UUID, or the original input if no match is found.
 */
export async function resolveWalletIdByName(userId: string, walletId: string): Promise<string> {
  if (UUID_PATTERN.test(walletId)) {
    return walletId;
  }

  const { wallets } = await getAccessibleWallets(userId);
  const normalizedInput = normalizeForMatch(walletId);

  // Try exact match first, then partial match
  const exactMatch = wallets.find((w) => normalizeForMatch(w.name) === normalizedInput);
  if (exactMatch) {
    return exactMatch.id;
  }

  // Fall back to partial match
  const partialMatch = wallets.find((w) => {
    const normalizedName = normalizeForMatch(w.name);
    return normalizedName.includes(normalizedInput) || normalizedInput.includes(normalizedName);
  });

  return partialMatch?.id ?? walletId;
}

function buildCategoryMap(categories: CategoryRow[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

function buildWalletMap(wallets: WalletRow[]) {
  return new Map(wallets.map((wallet) => [wallet.id, wallet]));
}

function mapTransactionError(message: string, linkedSavingTransactionMessage: string) {
  if (message.includes("saving_transaction_managed_by_entries")) {
    return linkedSavingTransactionMessage;
  }

  return message;
}

function normalizeForMatch(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export async function getCategoriesForWallets(userId: string, walletIds?: string[] | null): Promise<AiCategoryOption[]> {
  const access = await getAccessibleWallets(userId);
  const requestedWalletIds = walletIds?.filter(Boolean) ?? [];

  requestedWalletIds.forEach((walletId) => assertAccessibleWallet(access.walletIds, walletId));

  const targetWalletIds = requestedWalletIds.length > 0 ? requestedWalletIds : access.walletIds;
  const [wallets, categories] = await Promise.all([
    targetWalletIds.length === access.walletIds.length ? access.wallets : queryWallets(targetWalletIds),
    queryCategories(targetWalletIds)
  ]);
  const walletMap = buildWalletMap(wallets);

  return categories.map((category) => ({
    id: category.id,
    walletId: category.wallet_id,
    walletName: walletMap.get(category.wallet_id)?.name ?? "Wallet",
    name: category.name,
    kind: category.kind,
    color: category.color,
    isSystem: category.is_system
  }));
}

export async function resolveCategoryByName(
  userId: string,
  walletId: string,
  categoryName: string,
  kind: TransactionKind
): Promise<AiCategoryOption | null> {
  const normalizedCategoryName = normalizeForMatch(categoryName);

  if (!normalizedCategoryName) {
    return null;
  }

  const categories = await getCategoriesForWallets(userId, [walletId]);
  const matchingCategories = categories
    .filter((category) => category.kind === kind)
    .sort((a, b) => b.name.length - a.name.length);

  const exactMatch = matchingCategories.find((category) => normalizeForMatch(category.name) === normalizedCategoryName);

  if (exactMatch) {
    return exactMatch;
  }

  return (
    matchingCategories.find((category) => {
      const normalizedExisting = normalizeForMatch(category.name);
      return normalizedExisting.includes(normalizedCategoryName) || normalizedCategoryName.includes(normalizedExisting);
    }) ?? null
  );
}

export async function createTransactionViaAi(userId: string, params: AiCreateTransactionParams): Promise<AiCreateTransactionResult> {
  const { memberships, walletIds, wallets } = await getAccessibleWallets(userId);
  const t = await getActionTranslator();
  assertAccessibleWallet(walletIds, params.walletId);

  const membership = memberships.find((item) => item.wallet_id === params.walletId);

  if (!membership || membership.role === "viewer") {
    return {
      ok: false,
      code: "WALLET_WRITE_DENIED",
      message: t("actionErrors.transactionWriteForbidden")
    };
  }

  if (params.kind !== "income" && params.kind !== "expense") {
    return {
      ok: false,
      code: "TRANSACTION_KIND_INVALID",
      message: t("actionErrors.transactionCategoryKindMismatch")
    };
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return {
      ok: false,
      code: "TRANSACTION_AMOUNT_INVALID",
      message: t("actionErrors.transactionAmountInvalid")
    };
  }

  const happenedAt = (params.happenedAt ?? "").trim() || getTodayDateString();

  if (!isValidDateString(happenedAt)) {
    return {
      ok: false,
      code: "TRANSACTION_DATE_INVALID",
      message: t("actionErrors.transactionDateInvalid")
    };
  }

  const transactionLimit = await checkFreeTransactionLimit(userId);

  if (!transactionLimit.allowed) {
    return {
      ok: false,
      code: "FREE_TIER_TRANSACTION_LIMIT_REACHED",
      message: t("actionErrors.freeTierTransactionLimitReached", {
        maxTransactions: transactionLimit.maxMonthlyTransactions
      })
    };
  }

  const rateLimit = await consumeTransactionRateLimit(userId);

  if (!rateLimit.allowed) {
    return {
      ok: false,
      code: "TRANSACTION_RATE_LIMITED",
      message: t("actionErrors.transactionRateLimited")
    };
  }

  const walletMap = buildWalletMap(wallets);
  const categories = await getCategoriesForWallets(userId, [params.walletId]);
  let resolvedCategory = categories.find((category) => category.id === (params.categoryId ?? "")) ?? null;

  if (params.categoryId && !resolvedCategory) {
    return {
      ok: false,
      code: "CATEGORY_NOT_FOUND",
      message: t("actionErrors.transactionCategoryNotFound")
    };
  }

  if (resolvedCategory && resolvedCategory.kind !== params.kind) {
    return {
      ok: false,
      code: "CATEGORY_KIND_MISMATCH",
      message: t("actionErrors.transactionCategoryKindMismatch")
    };
  }

  if (!resolvedCategory && params.categoryName) {
    resolvedCategory = await resolveCategoryByName(userId, params.walletId, params.categoryName, params.kind);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      wallet_id: params.walletId,
      category_id: resolvedCategory?.id ?? null,
      kind: params.kind,
      amount: params.amount,
      note: params.note?.trim() || null,
      happened_at: dateStringToISO(happenedAt),
      source: "manual",
      created_by: userId,
      updated_by: userId
    })
    .select("id, wallet_id, category_id, kind, amount, happened_at, note, source")
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: "TRANSACTION_INSERT_FAILED",
      message: mapTransactionError(error?.message ?? "TRANSACTION_INSERT_FAILED", t("actionStatus.linkedSavingTransaction"))
    };
  }

  await incrementTransactionCount(userId);

  const dashboardUserIds = await getWalletMemberUserIds(supabase, params.walletId);
  await invalidateWalletReadCaches(params.walletId, {
    targets: ["overview", "transactions", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(params.walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets", "reports"]
  });

  return {
    ok: true,
    message: t("actionSuccess.transactionSaved"),
    transaction: {
      id: data.id,
      walletId: data.wallet_id,
      walletName: walletMap.get(data.wallet_id)?.name ?? "Wallet",
      kind: data.kind,
      amount: data.amount,
      happenedAt: data.happened_at,
      categoryId: data.category_id,
      categoryName: resolvedCategory?.name ?? "Tanpa kategori",
      note: data.note,
      source: "manual"
    }
  };
}

export async function getCategoryFocusForUser(
  userId: string,
  period: RekapPeriod,
  prompt: string,
  walletId?: string | null
): Promise<AiCategoryFocus | null> {
  const normalizedPrompt = normalizeForMatch(prompt);

  if (!normalizedPrompt) {
    return null;
  }

  const { walletIds, wallets } = await getAccessibleWallets(userId);
  assertAccessibleWallet(walletIds, walletId);
  const targetWalletIds = walletId ? [walletId] : walletIds;
  const currentMonth = getCurrentMonthKey();
  const [allTransactions, categories, budgets] = await Promise.all([
    queryTransactions(targetWalletIds),
    queryCategories(targetWalletIds),
    queryBudgets(targetWalletIds, currentMonth)
  ]);
  const expenseCategories = categories.filter((category) => category.kind === "expense");
  const matchedCategory = expenseCategories
    .sort((a, b) => b.name.length - a.name.length)
    .find((category) => normalizedPrompt.includes(normalizeForMatch(category.name)));

  if (!matchedCategory) {
    return null;
  }

  const range = getPeriodRange(period);
  const previousRange = getPreviousPeriodRange(period);
  const startAt = Date.parse(range.start);
  const endAt = Date.parse(range.end);
  const previousStartAt = Date.parse(previousRange.start);
  const previousEndAt = Date.parse(previousRange.end);
  const walletMap = buildWalletMap(wallets);
  const matchingTransactions = allTransactions.filter((transaction) => {
    const happenedAt = Date.parse(transaction.happened_at);

    return (
      transaction.kind === "expense" &&
      transaction.category_id === matchedCategory.id &&
      Number.isFinite(happenedAt) &&
      happenedAt >= startAt &&
      happenedAt <= endAt
    );
  });
  const previousMatchingTransactions = allTransactions.filter((transaction) => {
    const happenedAt = Date.parse(transaction.happened_at);

    return (
      transaction.kind === "expense" &&
      transaction.category_id === matchedCategory.id &&
      Number.isFinite(happenedAt) &&
      happenedAt >= previousStartAt &&
      happenedAt <= previousEndAt
    );
  });

  const walletNames = Array.from(
    new Set(matchingTransactions.map((transaction) => walletMap.get(transaction.wallet_id)?.name ?? "Wallet"))
  );
  const recentNotes = matchingTransactions
    .map((transaction) => transaction.note?.trim())
    .filter((note): note is string => Boolean(note))
    .slice(0, 3);
  const matchedBudget = budgets.find((budget) => budget.category_id === matchedCategory.id);
  const monthTransactions = allTransactions.filter(
    (transaction) =>
      transaction.kind === "expense" &&
      transaction.category_id === matchedCategory.id &&
      transaction.happened_at.startsWith(currentMonth)
  );
  const spentThisMonth = monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const budgetInfo = matchedBudget
    ? {
        month: currentMonth,
        amount: matchedBudget.amount,
        spent: spentThisMonth,
        remaining: matchedBudget.amount - spentThisMonth,
        usagePercent: matchedBudget.amount > 0 ? Math.round((spentThisMonth / matchedBudget.amount) * 100) : 0,
        status:
          matchedBudget.amount > 0 && spentThisMonth > matchedBudget.amount
            ? ("over" as const)
            : matchedBudget.amount > 0 && spentThisMonth >= matchedBudget.amount * 0.8
              ? ("warning" as const)
              : ("safe" as const)
      }
    : null;
  const previousTotalExpense = previousMatchingTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const currentTotalExpense = matchingTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const deltaAmount = currentTotalExpense - previousTotalExpense;
  const previousPeriodInfo = {
    range: previousRange,
    totalExpense: previousTotalExpense,
    transactionCount: previousMatchingTransactions.length,
    deltaAmount,
    deltaPercent: previousTotalExpense > 0 ? Math.round((deltaAmount / previousTotalExpense) * 100) : null
  };

  return {
    categoryId: matchedCategory.id,
    categoryName: matchedCategory.name,
    totalExpense: currentTotalExpense,
    transactionCount: matchingTransactions.length,
    walletNames,
    recentNotes,
    budget: budgetInfo,
    previousPeriod: previousPeriodInfo
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
        budgetId: budget.id,
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

export type AiBudgetMutationParams = {
  walletId: string;
  categoryId: string;
  monthStart: string;
  amount: number;
};

export type AiBudgetUpdateParams = {
  walletId: string;
  budgetId: string;
  amount: number;
};

export type AiBudgetDeleteParams = {
  walletId: string;
  budgetId: string;
};

export type AiBudgetMutationResult = {
  ok: boolean;
  code?: string;
  message: string;
  budget?: {
    id: string;
    walletId: string;
    walletName: string;
    categoryId: string;
    categoryName: string;
    monthStart: string;
    amount: number;
  };
};

export async function createBudgetViaAi(
  userId: string,
  params: AiBudgetMutationParams
): Promise<AiBudgetMutationResult> {
  const { memberships, walletIds, wallets } = await getAccessibleWallets(userId);
  const t = await getActionTranslator();
  assertAccessibleWallet(walletIds, params.walletId);

  const membership = memberships.find((item) => item.wallet_id === params.walletId);

  if (!membership || membership.role === "viewer") {
    return {
      ok: false,
      code: "BUDGET_WRITE_DENIED",
      message: t("actionErrors.budgetWriteForbidden")
    };
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return {
      ok: false,
      code: "BUDGET_AMOUNT_INVALID",
      message: t("actionErrors.budgetAmountInvalid")
    };
  }

  const walletMap = buildWalletMap(wallets);
  const categories = await getCategoriesForWallets(userId, [params.walletId]);
  const resolvedCategory = categories.find((c) => c.id === params.categoryId) ?? null;

  if (!resolvedCategory) {
    return {
      ok: false,
      code: "BUDGET_CATEGORY_NOT_FOUND",
      message: t("actionErrors.budgetCategoryNotFound")
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        wallet_id: params.walletId,
        category_id: params.categoryId,
        month_start: `${params.monthStart}-01`,
        amount: params.amount,
        created_by: userId,
        updated_by: userId
      },
      {
        onConflict: "wallet_id,category_id,month_start"
      }
    )
    .select("id, wallet_id, category_id, month_start, amount")
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: "BUDGET_UPSERT_FAILED",
      message: t("actionErrors.unexpectedError")
    };
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, params.walletId);
  await invalidateWalletReadCaches(params.walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(params.walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });

  return {
    ok: true,
    message: t("actionSuccess.budgetCreatedViaAi"),
    budget: {
      id: data.id,
      walletId: data.wallet_id,
      walletName: walletMap.get(data.wallet_id)?.name ?? "Wallet",
      categoryId: data.category_id,
      categoryName: resolvedCategory.name,
      monthStart: data.month_start,
      amount: data.amount
    }
  };
}

export async function updateBudgetViaAi(
  userId: string,
  params: AiBudgetUpdateParams
): Promise<AiBudgetMutationResult> {
  const { memberships, walletIds, wallets } = await getAccessibleWallets(userId);
  const t = await getActionTranslator();
  assertAccessibleWallet(walletIds, params.walletId);

  const membership = memberships.find((item) => item.wallet_id === params.walletId);

  if (!membership || membership.role === "viewer") {
    return {
      ok: false,
      code: "BUDGET_WRITE_DENIED",
      message: t("actionErrors.budgetWriteForbidden")
    };
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return {
      ok: false,
      code: "BUDGET_AMOUNT_INVALID",
      message: t("actionErrors.budgetAmountInvalid")
    };
  }

  const walletMap = buildWalletMap(wallets);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("budgets")
    .select("id, wallet_id, category_id, month_start, amount")
    .eq("id", params.budgetId)
    .eq("wallet_id", params.walletId)
    .single();

  if (!existing) {
    return {
      ok: false,
      code: "BUDGET_NOT_FOUND",
      message: t("actionErrors.budgetNotFound")
    };
  }

  const categories = await getCategoriesForWallets(userId, [params.walletId]);
  const resolvedCategory = categories.find((c) => c.id === existing.category_id) ?? null;

  const { data, error } = await supabase
    .from("budgets")
    .update({
      amount: params.amount,
      updated_by: userId
    })
    .eq("id", params.budgetId)
    .eq("wallet_id", params.walletId)
    .select("id, wallet_id, category_id, month_start, amount")
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: "BUDGET_UPDATE_FAILED",
      message: t("actionErrors.unexpectedError")
    };
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, params.walletId);
  await invalidateWalletReadCaches(params.walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(params.walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });

  return {
    ok: true,
    message: t("actionSuccess.budgetUpdatedViaAi"),
    budget: {
      id: data.id,
      walletId: data.wallet_id,
      walletName: walletMap.get(data.wallet_id)?.name ?? "Wallet",
      categoryId: data.category_id,
      categoryName: resolvedCategory?.name ?? "Tanpa kategori",
      monthStart: data.month_start,
      amount: data.amount
    }
  };
}

export async function deleteBudgetViaAi(
  userId: string,
  params: AiBudgetDeleteParams
): Promise<AiBudgetMutationResult> {
  const { memberships, walletIds } = await getAccessibleWallets(userId);
  const t = await getActionTranslator();
  assertAccessibleWallet(walletIds, params.walletId);

  const membership = memberships.find((item) => item.wallet_id === params.walletId);

  if (!membership || membership.role === "viewer") {
    return {
      ok: false,
      code: "BUDGET_WRITE_DENIED",
      message: t("actionErrors.budgetWriteForbidden")
    };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("id", params.budgetId)
    .eq("wallet_id", params.walletId)
    .single();

  if (!existing) {
    return {
      ok: false,
      code: "BUDGET_NOT_FOUND",
      message: t("actionErrors.budgetNotFound")
    };
  }

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", params.budgetId)
    .eq("wallet_id", params.walletId);

  if (error) {
    return {
      ok: false,
      code: "BUDGET_DELETE_FAILED",
      message: t("actionErrors.unexpectedError")
    };
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, params.walletId);
  await invalidateWalletReadCaches(params.walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await revalidateWalletPaths(params.walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });

  return {
    ok: true,
    message: t("actionSuccess.budgetDeletedViaAi")
  };
}
