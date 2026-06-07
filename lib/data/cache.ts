import "server-only";
import { defaultLocale, locales, type AppLocale } from "@/lib/i18n";
import { redisCache } from "@/lib/redis";

export const DASHBOARD_CACHE_TTL_SECONDS = 60;
export const WALLET_OVERVIEW_CACHE_TTL_SECONDS = 90;
export const TRANSACTIONS_CACHE_TTL_SECONDS = 90;
export const BUDGETS_CACHE_TTL_SECONDS = 120;
export const RECURRING_CACHE_TTL_SECONDS = 90;
export const SAVINGS_CACHE_TTL_SECONDS = 90;
export const SETTINGS_CACHE_TTL_SECONDS = 60;

export type WalletReadCacheTarget = "overview" | "transactions" | "budgets" | "recurring" | "savings";

function withLocaleSuffix(key: string, locale: AppLocale) {
  return locale === defaultLocale ? key : `${key}:${locale}`;
}

export function getDashboardCacheKey(userId: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`user:${userId}:dashboard`, locale);
}

export function getWalletOverviewCacheKey(userId: string, walletId: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`wallet:${walletId}:user:${userId}:overview`, locale);
}

export function getTransactionsCacheKey(userId: string, walletId: string, month: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`wallet:${walletId}:user:${userId}:transactions:${month}`, locale);
}

export function getTransactionHistoryCacheKey(userId: string, walletId: string, month: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`wallet:${walletId}:user:${userId}:transactions-history:${month}`, locale);
}

export function getBudgetsCacheKey(userId: string, walletId: string, month: string) {
  return `wallet:${walletId}:user:${userId}:budgets:${month}`;
}

export function getRecurringCacheKey(userId: string, walletId: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`wallet:${walletId}:user:${userId}:recurring`, locale);
}

export function getSavingsCacheKey(userId: string, walletId: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`wallet:${walletId}:user:${userId}:savings`, locale);
}

export function getWalletReadCachePatterns(walletId: string, targets: WalletReadCacheTarget[]) {
  return Array.from(
    new Set(
      targets.map((target) => {
        switch (target) {
          case "overview":
            return `wallet:${walletId}:user:*:overview*`;
          case "transactions":
            return `wallet:${walletId}:user:*:transactions:*`;
          case "budgets":
            return `wallet:${walletId}:user:*:budgets:*`;
          case "recurring":
            return `wallet:${walletId}:user:*:recurring*`;
          case "savings":
            return `wallet:${walletId}:user:*:savings*`;
        }
      })
    )
  );
}

export function getSettingsCacheKey(userId: string) {
  return `user:${userId}:settings`;
}

export async function invalidateSettingsCache(userId: string) {
  await redisCache.del(getSettingsCacheKey(userId));
}

export async function invalidateDashboardCache(userIds?: string[]) {
  if (userIds?.length) {
    await redisCache.del(userIds.flatMap((userId) => locales.map((locale) => getDashboardCacheKey(userId, locale))));
    return;
  }

  await redisCache.delByPrefixes(["user:"]);
}

export async function invalidateWalletReadCaches(
  walletId: string,
  options: {
    targets: WalletReadCacheTarget[];
    dashboardUserIds?: string[];
  }
) {
  const patterns = getWalletReadCachePatterns(walletId, options.targets);

  if (patterns.length > 0) {
    await redisCache.delByPatterns(patterns);
  }

  if (options.dashboardUserIds?.length) {
    await invalidateDashboardCache(options.dashboardUserIds);
  }
}
