import "server-only";
import { defaultLocale, locales, type AppLocale } from "@/lib/i18n";
import { redisCache } from "@/lib/redis";

export const DASHBOARD_CACHE_TTL_SECONDS = 300;
export const WALLET_OVERVIEW_CACHE_TTL_SECONDS = 300;
export const TRANSACTIONS_CACHE_TTL_SECONDS = 300;
export const BUDGETS_CACHE_TTL_SECONDS = 300;
export const CATEGORIES_CACHE_TTL_SECONDS = 300;
export const RECURRING_CACHE_TTL_SECONDS = 300;
export const SAVINGS_CACHE_TTL_SECONDS = 300;
export const SETTINGS_CACHE_TTL_SECONDS = 600;
export const WALLET_BUNDLE_CACHE_TTL_SECONDS = 120;
export const SHELL_DATA_CACHE_TTL_SECONDS = 300;

export type WalletReadCacheTarget = "overview" | "transactions" | "budgets" | "categories" | "recurring" | "savings" | "bundle";

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

export function getTransactionHistoryCacheKey(
  userId: string,
  walletId: string,
  month: string,
  locale: AppLocale = "id",
  options?: {
    page?: number;
    search?: string;
    sortBy?: string;
    sortDirection?: string;
  },
) {
  const base = `wallet:${walletId}:user:${userId}:transactions-history:${month}`;
  const page = options?.page ?? 1;
  const search = options?.search?.trim() ? `:q:${encodeURIComponent(options.search.trim())}` : "";
  const sortBy = options?.sortBy ? `:sort:${options.sortBy}` : "";
  const sortDirection = options?.sortDirection ? `:dir:${options.sortDirection}` : "";
  const suffix = `:page:${page}${search}${sortBy}${sortDirection}`;
  return withLocaleSuffix(`${base}${suffix}`, locale);
}

export function getBudgetsCacheKey(userId: string, walletId: string, month: string) {
  return `wallet:${walletId}:user:${userId}:budgets:${month}`;
}

export function getCategoriesCacheKey(userId: string, walletId: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`wallet:${walletId}:user:${userId}:categories`, locale);
}

export function getRecurringCacheKey(userId: string, walletId: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`wallet:${walletId}:user:${userId}:recurring`, locale);
}

export function getSavingsCacheKey(userId: string, walletId: string, locale: AppLocale = "id") {
  return withLocaleSuffix(`wallet:${walletId}:user:${userId}:savings`, locale);
}

export function getWalletBundleCacheKey(userId: string, walletId: string) {
  return `wallet:${walletId}:user:${userId}:bundle`;
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
          case "categories":
            return `wallet:${walletId}:user:*:categories*`;
          case "recurring":
            return `wallet:${walletId}:user:*:recurring*`;
          case "savings":
            return `wallet:${walletId}:user:*:savings*`;
          case "bundle":
            return `wallet:${walletId}:user:*:bundle*`;
        }
      })
    )
  );
}

export function getSettingsCacheKey(userId: string) {
  return `user:${userId}:settings`;
}

export function getShellDataCacheKey(userId: string) {
  return `user:${userId}:shell`;
}

export function getAiInsightCachePattern(userId: string) {
  return `ai:insight:${userId}:*`;
}

export async function invalidateSettingsCache(userId: string) {
  await redisCache.del(getSettingsCacheKey(userId));
}

export async function invalidateShellDataCache(userIds: string | string[]) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  if (ids.length === 0) return;
  await redisCache.del(ids.map(getShellDataCacheKey));
}

export async function invalidateAiInsightCache(userIds: string[]) {
  if (userIds.length === 0) {
    return;
  }

  await redisCache.delByPatterns(userIds.map(getAiInsightCachePattern));
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
