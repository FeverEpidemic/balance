import { cache } from "react";
import { getCurrentMonthKey } from "@/lib/finance";
import { defaultLocale, translate, type AppLocale } from "@/lib/i18n";
import { redisCache } from "@/lib/redis";
import {
  buildMonthlyReport,
  buildWalletSummaries,
  createBudgetsPageData,
  createCategoriesPageData,
  createDashboardData,
  createRecurringTransactionsPageData,
  createSavingsPageData,
  createTransactionHistoryPageData,
  createTransactionsPageData,
  createWalletOverviewData
} from "@/lib/data/mappers";
import {
  BUDGETS_CACHE_TTL_SECONDS,
  CATEGORIES_CACHE_TTL_SECONDS,
  DASHBOARD_CACHE_TTL_SECONDS,
  getBudgetsCacheKey,
  getCategoriesCacheKey,
  getDashboardCacheKey,
  getRecurringCacheKey,
  getSavingsCacheKey,
  getSettingsCacheKey,
  getTransactionHistoryCacheKey,
  getTransactionsCacheKey,
  getWalletOverviewCacheKey,
  RECURRING_CACHE_TTL_SECONDS,
  SAVINGS_CACHE_TTL_SECONDS,
  SETTINGS_CACHE_TTL_SECONDS,
  TRANSACTIONS_CACHE_TTL_SECONDS,
  WALLET_OVERVIEW_CACHE_TTL_SECONDS
} from "@/lib/data/cache";
import {
  queryBudgets,
  queryCategories,
  queryCurrentUserWalletIds,
  queryInvitationTokens,
  queryInvitations,
  queryProfiles,
  queryRecurringTransactions,
  querySavingEntries,
  querySavings,
  querySettlements,
  queryTemplates,
  queryTransactions,
  queryTransactionsByMonth,
  queryTransactionSplits,
  queryUserApiKeys,
  queryWalletMembers,
  queryWallets
} from "@/lib/data/queries";
import type { SettingsApiKeyItem, SettingsData, WalletBundle } from "@/lib/data/types";

export * from "@/lib/data/mappers";
export * from "@/lib/data/types";
export { queryInvitationTokens } from "@/lib/data/queries";

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
    userName: profiles[0]?.full_name || profiles[0]?.email || translate(defaultLocale, "common.user"),
    walletCount: wallets.length,
    budgetCount: budgets.length,
    memberCount: new Set(memberRows.map((row) => row.user_id)).size,
    primaryWalletId: wallets[0]?.id ?? null,
    preferredLocale: profiles[0]?.preferred_locale ?? defaultLocale,
    themePreference: profiles[0]?.theme_preference ?? "system",
    onboardingState: profiles[0]?.onboarding_state ?? "active",
    onboardingDismissedAt: profiles[0]?.onboarding_dismissed_at ?? null,
    onboardingCompletedAt: profiles[0]?.onboarding_completed_at ?? null,
    timezone: profiles[0]?.timezone ?? null,
    defaultCurrency: profiles[0]?.default_currency ?? "IDR"
  };
});

export const getDashboardData = cache(async (userId: string, locale: AppLocale = defaultLocale) => {
  return redisCache.getOrSet(getDashboardCacheKey(userId, locale), DASHBOARD_CACHE_TTL_SECONDS, async () => {
    const month = getCurrentMonthKey();
    const { memberships, walletIds } = await getMembershipContext(userId);
    const [shell, wallets, memberRows, budgets, recentTransactions, categories, splits, allTransactions, savings, savingEntries] = await Promise.all([
      getShellData(userId),
      queryWallets(walletIds),
      queryWalletMembers(walletIds),
      queryBudgets(walletIds, month),
      queryTransactions(walletIds, 8),
      queryCategories(walletIds),
      queryTransactionSplits(walletIds),
      queryTransactions(walletIds),
      querySavings(walletIds),
      querySavingEntries(walletIds)
    ]);

    return createDashboardData({
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
      locale
    });
  });
});

export const getWalletBundle = cache(async (userId: string, walletId: string) => {
  const month = getCurrentMonthKey();
  const { memberships, walletIds } = await getMembershipContext(userId);

  if (!walletIds.includes(walletId)) {
    return null;
  }

  const [shell, wallets, memberRows, categories, budgets, recurringTransactions, transactions, templates, settlements, invitations, savings, savingEntries] = await Promise.all([
    getShellData(userId),
    queryWallets([walletId]),
    queryWalletMembers([walletId]),
    queryCategories([walletId]),
    queryBudgets([walletId], month),
    queryRecurringTransactions([walletId]),
    queryTransactions([walletId]),
    queryTemplates([walletId]),
    querySettlements([walletId]),
    queryInvitations([walletId]),
    querySavings([walletId]),
    querySavingEntries([walletId])
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
    savings,
    savingEntries,
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
    recurringTransactions,
    savings,
    savingEntries,
    settlements,
    templates,
    transactions,
    invitations,
    wallet: summary
  } satisfies WalletBundle;
});

export const getWalletOverviewData = cache(async (userId: string, walletId: string, locale: AppLocale = defaultLocale) => {
  return redisCache.getOrSet(getWalletOverviewCacheKey(userId, walletId, locale), WALLET_OVERVIEW_CACHE_TTL_SECONDS, async () => {
    const month = getCurrentMonthKey();
    const { memberships, walletIds } = await getMembershipContext(userId);

    if (!walletIds.includes(walletId)) {
      return null;
    }

    const [shell, wallets, memberRows, categories, budgets, transactions, templates, savings, savingEntries] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryWalletMembers([walletId]),
      queryCategories([walletId]),
      queryBudgets([walletId], month),
      queryTransactions([walletId]),
      queryTemplates([walletId]),
      querySavings([walletId]),
      querySavingEntries([walletId])
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
      savings,
      savingEntries,
      templates,
      month,
      locale
    });
  });
});

export const getTransactionsPageData = cache(async (userId: string, walletId: string, selectedMonth: string, locale: AppLocale = defaultLocale) => {
  return redisCache.getOrSet(getTransactionsCacheKey(userId, walletId, selectedMonth, locale), TRANSACTIONS_CACHE_TTL_SECONDS, async () => {
    const { memberships, walletIds } = await getMembershipContext(userId);

    if (!walletIds.includes(walletId)) {
      return null;
    }

    const [shell, wallets, categories, transactions] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryCategories([walletId]),
      queryTransactionsByMonth([walletId], selectedMonth, 8)
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
      selectedMonth,
      locale
    });
  });
});

export const getTransactionHistoryPageData = cache(
  async (userId: string, walletId: string, selectedMonth: string, locale: AppLocale = defaultLocale) => {
    return redisCache.getOrSet(
      getTransactionHistoryCacheKey(userId, walletId, selectedMonth, locale),
      TRANSACTIONS_CACHE_TTL_SECONDS,
      async () => {
        const { memberships, walletIds } = await getMembershipContext(userId);

        if (!walletIds.includes(walletId)) {
          return null;
        }

        const [shell, wallets, categories, transactions] = await Promise.all([
          getShellData(userId),
          queryWallets([walletId]),
          queryCategories([walletId]),
          queryTransactionsByMonth([walletId], selectedMonth)
        ]);

        const wallet = wallets[0];

        if (!wallet) {
          return null;
        }

        return createTransactionHistoryPageData({
          shell,
          wallet,
          memberships,
          categories,
          transactions,
          selectedMonth,
          locale
        });
      }
    );
  }
);

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

export const getCategoriesPageData = cache(async (userId: string, walletId: string, locale: AppLocale = defaultLocale) => {
  return redisCache.getOrSet(getCategoriesCacheKey(userId, walletId, locale), CATEGORIES_CACHE_TTL_SECONDS, async () => {
    const { memberships, walletIds } = await getMembershipContext(userId);

    if (!walletIds.includes(walletId)) {
      return null;
    }

    const [shell, wallets, categories] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryCategories([walletId])
    ]);

    const wallet = wallets[0];

    if (!wallet) {
      return null;
    }

    return createCategoriesPageData({
      shell,
      wallet,
      memberships,
      categories
    });
  });
});

export const getRecurringTransactionsPageData = cache(async (userId: string, walletId: string, locale: AppLocale = defaultLocale) => {
  return redisCache.getOrSet(getRecurringCacheKey(userId, walletId, locale), RECURRING_CACHE_TTL_SECONDS, async () => {
    const { memberships, walletIds } = await getMembershipContext(userId);

    if (!walletIds.includes(walletId)) {
      return null;
    }

    const [shell, wallets, categories, recurringTransactions] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryCategories([walletId]),
      queryRecurringTransactions([walletId])
    ]);

    const wallet = wallets[0];

    if (!wallet) {
      return null;
    }

    return createRecurringTransactionsPageData({
      shell,
      wallet,
      memberships,
      categories,
      recurringTransactions,
      locale
    });
  });
});

export const getSettingsData = cache(async (userId: string): Promise<SettingsData> => {
  return redisCache.getOrSet(getSettingsCacheKey(userId), SETTINGS_CACHE_TTL_SECONDS, async () => {
    const [shell, apiKeyRows] = await Promise.all([
      getShellData(userId),
      queryUserApiKeys(userId)
    ]);

    const apiKeys: SettingsApiKeyItem[] = apiKeyRows.map((row) => ({
      id: row.id,
      name: row.name,
      keyPrefix: row.key_prefix,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      isRevoked: !!row.revoked_at
    }));

    return {
      shell,
      apiKeys,
      preferredLocale: shell.preferredLocale ?? defaultLocale,
      themePreference: shell.themePreference ?? "system",
      timezone: shell.timezone ?? null,
      defaultCurrency: shell.defaultCurrency ?? "IDR"
    };
  });
});

export const getSavingsPageData = cache(async (userId: string, walletId: string, locale: AppLocale = defaultLocale) => {
  return redisCache.getOrSet(getSavingsCacheKey(userId, walletId, locale), SAVINGS_CACHE_TTL_SECONDS, async () => {
    const month = getCurrentMonthKey();
    const { memberships, walletIds } = await getMembershipContext(userId);

    if (!walletIds.includes(walletId)) {
      return null;
    }

    const [shell, wallets, memberRows, transactions, budgets, savings, savingEntries] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryWalletMembers([walletId]),
      queryTransactions([walletId]),
      queryBudgets([walletId], month),
      querySavings([walletId]),
      querySavingEntries([walletId])
    ]);

    const wallet = wallets[0];

    if (!wallet) {
      return null;
    }

    const [walletSummary] = buildWalletSummaries({
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

    const memberIds = [...new Set(memberRows.map((row) => row.user_id))];
    const profiles = await queryProfiles(memberIds);
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    return createSavingsPageData({
      shell,
      wallet,
      memberships,
      memberRows,
      profileMap,
      savings,
      savingEntries,
      walletSummary,
      locale
    });
  });
});
