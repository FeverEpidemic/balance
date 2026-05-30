import "server-only";
import { redisCache } from "@/lib/redis";

export const DASHBOARD_CACHE_TTL_SECONDS = 60;
export const WALLET_OVERVIEW_CACHE_TTL_SECONDS = 90;
export const TRANSACTIONS_CACHE_TTL_SECONDS = 90;
export const BUDGETS_CACHE_TTL_SECONDS = 120;

export function getDashboardCacheKey(userId: string) {
  return `user:${userId}:dashboard`;
}

export function getWalletOverviewCacheKey(userId: string, walletId: string) {
  return `wallet:${walletId}:user:${userId}:overview`;
}

export function getTransactionsCacheKey(userId: string, walletId: string, month: string) {
  return `wallet:${walletId}:user:${userId}:transactions:${month}`;
}

export function getBudgetsCacheKey(userId: string, walletId: string, month: string) {
  return `wallet:${walletId}:user:${userId}:budgets:${month}`;
}

export async function invalidateDashboardCache(userId?: string) {
  if (userId) {
    await redisCache.del(getDashboardCacheKey(userId));
    return;
  }

  await redisCache.delByPrefixes(["user:"]);
}

export async function invalidateWalletCache(walletId: string) {
  await redisCache.delByPrefixes([`wallet:${walletId}:`]);
}

export async function invalidateWalletReadCaches(walletId: string, options: { includeDashboards?: boolean; userId?: string } = {}) {
  await invalidateWalletCache(walletId);

  if (options.includeDashboards) {
    // Shared wallet mutations can affect dashboard totals for multiple members,
    // so clear all dashboard entries rather than guessing member ids here.
    await invalidateDashboardCache(options.userId);
  }
}
