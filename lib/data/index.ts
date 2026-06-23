import { cache } from "react";
import { getCurrentMonthKey } from "@/lib/finance";
import { defaultLocale, translate, type AppLocale } from "@/lib/i18n";
import { redisCache } from "@/lib/redis";
import { getAiChatDailyLimitMax } from "@/lib/env";
import { getAiChatComplianceState } from "@/lib/ai/compliance";
import { getEffectivePlanType, getTrialMeta } from "@/lib/plan";
import { ensureProfileForUser } from "@/lib/profile";
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
  getShellDataCacheKey,
  getTransactionHistoryCacheKey,
  getTransactionsCacheKey,
  getWalletBundleCacheKey,
  getWalletOverviewCacheKey,
  RECURRING_CACHE_TTL_SECONDS,
  SAVINGS_CACHE_TTL_SECONDS,
  SETTINGS_CACHE_TTL_SECONDS,
  SHELL_DATA_CACHE_TTL_SECONDS,
  TRANSACTIONS_CACHE_TTL_SECONDS,
  WALLET_BUNDLE_CACHE_TTL_SECONDS,
  WALLET_OVERVIEW_CACHE_TTL_SECONDS
} from "@/lib/data/cache";
import {
  queryAllBudgets,
  queryBudgets,
  queryCategories,
  queryCurrentUserWalletIds,
  queryDebtPaymentsByWallet,
  queryDebts,
  queryHasManualTransaction,
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
  queryWalletBalances,
  queryWalletMembers,
  queryWallets
} from "@/lib/data/queries";
import type {
  ProfileRow,
  SettingsApiKeyItem,
  SettingsData,
  SortDirection,
  TransactionHistorySortField,
  WalletBundle,
  DebtsPageData
} from "@/lib/data/types";

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
  return redisCache.getOrSet(getShellDataCacheKey(userId), SHELL_DATA_CACHE_TTL_SECONDS, async () => {
    const month = getCurrentMonthKey();
    const { walletIds } = await getMembershipContext(userId);
    const [wallets, memberRows, budgets, profiles] = await Promise.all([
      queryWallets(walletIds),
      queryWalletMembers(walletIds),
      queryBudgets(walletIds, month),
      queryProfiles([userId])
    ]);

    // Lazily ensure profile exists — only runs on first visit for new users
    if (!profiles[0]) {
      const created = await ensureProfileForUser({ id: userId });
      if (created) {
        // Re-query to get the full profile row
        const [fullProfile] = await queryProfiles([userId]);
        if (fullProfile) {
          profiles[0] = fullProfile;
        }
      }
    }

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
});

export const getDashboardData = cache(async (userId: string, locale: AppLocale = defaultLocale) => {
  return redisCache.getOrSet(getDashboardCacheKey(userId, locale), DASHBOARD_CACHE_TTL_SECONDS, async () => {
    const month = getCurrentMonthKey();
    const { memberships, walletIds } = await getMembershipContext(userId);
    const [shell, wallets, memberRows, budgets, recentTransactions, categories, splits, monthTransactions, balanceRows, hasManualTransaction, savings, savingEntries] = await Promise.all([
      getShellData(userId),
      queryWallets(walletIds),
      queryWalletMembers(walletIds),
      queryBudgets(walletIds, month),
      queryTransactions(walletIds, 8),
      queryCategories(walletIds),
      queryTransactionSplits(walletIds),
      queryTransactionsByMonth(walletIds, { month }),
      queryWalletBalances(walletIds),
      queryHasManualTransaction(walletIds),
      querySavings(walletIds),
      querySavingEntries(walletIds)
    ]);

    const balancesByWallet = new Map(balanceRows.map((row) => [row.wallet_id, row.available_balance]));

    return createDashboardData({
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
      locale
    });
  });
});

export const getWalletBundle = cache(async (userId: string, walletId: string) => {
  const data = await redisCache.getOrSet(
    getWalletBundleCacheKey(userId, walletId),
    WALLET_BUNDLE_CACHE_TTL_SECONDS,
    async () => {
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
      const profileMap: Record<string, ProfileRow> = {};
      for (const profile of profiles) {
        profileMap[profile.id] = profile;
      }

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
      };
    }
  );

  if (!data) {
    return null;
  }

  // Reconstitute Map from serialized Record for callers that use .get()
  return {
    ...data,
    profileMap: new Map(Object.entries(data.profileMap))
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
      queryTransactionsByMonth([walletId], { month: selectedMonth, limit: 8 })
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
  async (
    userId: string,
    walletId: string,
    selectedMonth: string,
    locale: AppLocale = defaultLocale,
    options?: {
      searchQuery?: string;
      sortBy?: TransactionHistorySortField;
      sortDirection?: SortDirection;
      page?: number;
    }
  ) => {
    return redisCache.getOrSet(
      getTransactionHistoryCacheKey(userId, walletId, selectedMonth, locale, {
        page: options?.page,
        search: options?.searchQuery,
        sortBy: options?.sortBy,
        sortDirection: options?.sortDirection
      }),
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
          queryTransactionsByMonth([walletId], {
            month: selectedMonth
          })
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
          locale,
          searchQuery: options?.searchQuery,
          sortBy: options?.sortBy,
          sortDirection: options?.sortDirection,
          page: options?.page
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

    const [shell, wallets, categories, budgets, transactions, allBudgets] = await Promise.all([
      getShellData(userId),
      queryWallets([walletId]),
      queryCategories([walletId]),
      queryBudgets([walletId], selectedMonth),
      queryTransactions([walletId]),
      queryAllBudgets([walletId])
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
      allBudgets,
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
    const [shell, apiKeyRows, profiles] = await Promise.all([
      getShellData(userId),
      queryUserApiKeys(userId),
      queryProfiles([userId])
    ]);

    const apiKeys: SettingsApiKeyItem[] = apiKeyRows.map((row) => ({
      id: row.id,
      name: row.name,
      keyPrefix: row.key_prefix,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      isRevoked: !!row.revoked_at
    }));

    const profile = profiles[0];
    const planType = profile?.plan_type ?? "free";
    const trialEndsAt = profile?.trial_ends_at ?? null;
    const effectivePlan = getEffectivePlanType(planType, trialEndsAt);
    const trialMeta = getTrialMeta(planType, trialEndsAt);
    const aiCompliance = getAiChatComplianceState(profile);

    return {
      shell,
      apiKeys,
      preferredLocale: profile?.preferred_locale ?? shell.preferredLocale ?? defaultLocale,
      themePreference: profile?.theme_preference ?? shell.themePreference ?? "system",
      timezone: profile?.timezone ?? shell.timezone ?? null,
      defaultCurrency: profile?.default_currency ?? shell.defaultCurrency ?? "IDR",
      aiChatEnabled: aiCompliance.aiChatEnabled,
      aiChatConsentRequired: aiCompliance.aiChatConsentRequired,
      aiChatConsentVersion: aiCompliance.aiChatConsentVersion,
      planType: effectivePlan,
      trialMeta,
      aiChatDailyLimit: effectivePlan === "premium" ? null : getAiChatDailyLimitMax(),
      dailyReminderEnabled: profile?.daily_reminder_enabled ?? false,
      dailyReminderTime: profile?.daily_reminder_time ? profile.daily_reminder_time.slice(0, 5) : "20:00"
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

export const getDebtsPageData = cache(async (userId: string, walletId: string) => {
  const { memberships, walletIds } = await getMembershipContext(userId);

  if (!walletIds.includes(walletId)) {
    return null;
  }

  const [shell, wallet, debts, payments] = await Promise.all([
    getShellData(userId),
    queryWallets([walletId]).then((w) => w[0]),
    queryDebts(walletId),
    queryDebtPaymentsByWallet(walletId)
  ]);

  if (!wallet) {
    return null;
  }

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: memberships.find((m) => m.wallet_id === walletId)?.role ?? "viewer",
    debts,
    payments
  } satisfies DebtsPageData;
});
