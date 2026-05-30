import { cache } from "react";
import { getCurrentMonthKey } from "@/lib/finance";
import { redisCache } from "@/lib/redis";
import {
  buildMonthlyReport,
  buildWalletSummaries,
  createBudgetsPageData,
  createDashboardData,
  createTransactionsPageData,
  createWalletOverviewData
} from "@/lib/data/mappers";
import {
  BUDGETS_CACHE_TTL_SECONDS,
  DASHBOARD_CACHE_TTL_SECONDS,
  getBudgetsCacheKey,
  getDashboardCacheKey,
  getTransactionsCacheKey,
  getWalletOverviewCacheKey,
  TRANSACTIONS_CACHE_TTL_SECONDS,
  WALLET_OVERVIEW_CACHE_TTL_SECONDS
} from "@/lib/data/cache";
import {
  queryBudgets,
  queryCategories,
  queryCurrentUserWalletIds,
  queryInvitations,
  queryProfiles,
  querySettlements,
  queryTemplates,
  queryTransactions,
  queryTransactionSplits,
  queryWalletMembers,
  queryWallets
} from "@/lib/data/queries";
import type { WalletBundle } from "@/lib/data/types";

export * from "@/lib/data/mappers";
export * from "@/lib/data/types";

async function getMembershipContext(userId: string) {
  const memberships = await queryCurrentUserWalletIds(userId);
  return {
    memberships,
    walletIds: memberships.map((membership) => membership.wallet_id)
  };
}

export const getShellData = cache(async (userId: string) => {
  const month = getCurrentMonthKey();
  const { walletIds } = await getMembershipContext(userId);
  const [wallets, memberRows, budgets, profiles] = await Promise.all([
    queryWallets(walletIds),
    queryWalletMembers(walletIds),
    queryBudgets(walletIds, month),
    queryProfiles([userId])
  ]);

  return {
    userName: profiles[0]?.full_name || profiles[0]?.email || "Pengguna",
    walletCount: wallets.length,
    budgetCount: budgets.length,
    memberCount: new Set(memberRows.map((row) => row.user_id)).size,
    primaryWalletId: wallets[0]?.id ?? null
  };
});

export const getDashboardData = cache(async (userId: string) => {
  return redisCache.getOrSet(getDashboardCacheKey(userId), DASHBOARD_CACHE_TTL_SECONDS, async () => {
    const month = getCurrentMonthKey();
    const { memberships, walletIds } = await getMembershipContext(userId);
    const [shell, wallets, memberRows, budgets, recentTransactions, categories, splits, allTransactions] = await Promise.all([
      getShellData(userId),
      queryWallets(walletIds),
      queryWalletMembers(walletIds),
      queryBudgets(walletIds, month),
      queryTransactions(walletIds, 8),
      queryCategories(walletIds),
      queryTransactionSplits(walletIds),
      queryTransactions(walletIds)
    ]);

    return createDashboardData({
      shell,
      memberships,
      wallets,
      memberRows,
      budgets,
      recentTransactions,
      allTransactions,
      categories,
      splits,
      month
    });
  });
});

export const getWalletBundle = cache(async (userId: string, walletId: string) => {
  const month = getCurrentMonthKey();
  const { memberships, walletIds } = await getMembershipContext(userId);

  if (!walletIds.includes(walletId)) {
    return null;
  }

  const [shell, wallets, memberRows, categories, budgets, transactions, templates, settlements, invitations] = await Promise.all([
    getShellData(userId),
    queryWallets([walletId]),
    queryWalletMembers([walletId]),
    queryCategories([walletId]),
    queryBudgets([walletId], month),
    queryTransactions([walletId]),
    queryTemplates([walletId]),
    querySettlements([walletId]),
    queryInvitations([walletId])
  ]);

  const wallet = wallets[0];

  if (!wallet) {
    return null;
  }

  const [summary] = buildWalletSummaries({
    memberships,
    wallets: [wallet],
    memberRows,
    transactions,
    budgets,
    month
  });

  const memberIds = [...new Set(memberRows.map((row) => row.user_id))];
  const profiles = await queryProfiles(memberIds);
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return {
    shell,
    profileMap,
    categories,
    budgets,
    members: memberRows,
    settlements,
    templates,
    transactions,
    invitations,
    wallet: summary
  } satisfies WalletBundle;
});

export const getWalletOverviewData = cache(async (userId: string, walletId: string) => {
  return redisCache.getOrSet(getWalletOverviewCacheKey(userId, walletId), WALLET_OVERVIEW_CACHE_TTL_SECONDS, async () => {
    const month = getCurrentMonthKey();
    const { memberships, walletIds } = await getMembershipContext(userId);

    if (!walletIds.includes(walletId)) {
      return null;
    }

    const [shell, wallets, memberRows, categories, budgets, transactions, templates] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryWalletMembers([walletId]),
      queryCategories([walletId]),
      queryBudgets([walletId], month),
      queryTransactions([walletId]),
      queryTemplates([walletId])
    ]);

    const wallet = wallets[0];

    if (!wallet) {
      return null;
    }

    return createWalletOverviewData({
      shell,
      wallet,
      memberships,
      memberRows,
      categories,
      budgets,
      transactions,
      templates,
      month
    });
  });
});

export const getTransactionsPageData = cache(async (userId: string, walletId: string, selectedMonth: string) => {
  return redisCache.getOrSet(getTransactionsCacheKey(userId, walletId, selectedMonth), TRANSACTIONS_CACHE_TTL_SECONDS, async () => {
    const { memberships, walletIds } = await getMembershipContext(userId);

    if (!walletIds.includes(walletId)) {
      return null;
    }

    const [shell, wallets, categories, transactions] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryCategories([walletId]),
      queryTransactions([walletId])
    ]);

    const wallet = wallets[0];

    if (!wallet) {
      return null;
    }

    return createTransactionsPageData({
      shell,
      wallet,
      memberships,
      categories,
      transactions,
      selectedMonth
    });
  });
});

export const getBudgetsPageData = cache(async (userId: string, walletId: string, selectedMonth: string) => {
  return redisCache.getOrSet(getBudgetsCacheKey(userId, walletId, selectedMonth), BUDGETS_CACHE_TTL_SECONDS, async () => {
    const { memberships, walletIds } = await getMembershipContext(userId);

    if (!walletIds.includes(walletId)) {
      return null;
    }

    const [shell, wallets, categories, budgets, transactions] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryCategories([walletId]),
      queryBudgets([walletId], selectedMonth),
      queryTransactions([walletId])
    ]);

    const wallet = wallets[0];

    if (!wallet) {
      return null;
    }

    return createBudgetsPageData({
      shell,
      wallet,
      memberships,
      categories,
      budgets,
      transactions,
      selectedMonth
    });
  });
});
