/**
 * Short-lived in-memory cache for AI read data (recap, wallet options).
 *
 * - TTL: 30 seconds by default
 * - Keys include userId to prevent cross-user leakage
 * - No external dependencies; pure Node Map
 * - Best-effort: feature works when cache is empty/missed
 */
import "server-only";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

function cacheKeyAiRecap(userId: string, period: string, walletId: string | null): string {
  return `ai:recap:${userId}:${period}:${walletId ?? "all"}`;
}

function cacheKeyAiWalletOptions(userId: string): string {
  return `ai:walletOptions:${userId}`;
}

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() > entry.expiresAt;
}

/**
 * Wraps a factory call with a short-lived in-memory cache for AI recap data.
 * TTL defaults to 30 seconds.
 */
export async function cachedAiRecap<T>(
  userId: string,
  period: string,
  walletId: string | null,
  factory: () => Promise<T>,
  ttlSeconds = 30
): Promise<T> {
  const key = cacheKeyAiRecap(userId, period, walletId);
  const existing = store.get(key);

  if (existing && !isExpired(existing)) {
    return existing.data as T;
  }

  const data = await factory();
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data;
}

/**
 * Wraps a factory call with a short-lived in-memory cache for AI wallet options.
 * TTL defaults to 30 seconds.
 */
export async function cachedAiWalletOptions<T>(
  userId: string,
  factory: () => Promise<T>,
  ttlSeconds = 30
): Promise<T> {
  const key = cacheKeyAiWalletOptions(userId);
  const existing = store.get(key);

  if (existing && !isExpired(existing)) {
    return existing.data as T;
  }

  const data = await factory();
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data;
}

/**
 * Invalidates all AI read cache entries for a given userId.
 * Called after transaction/budget mutations so next chat reads fresh data.
 */
export function invalidateAiReadCache(userId: string): void {
  const prefixRecap = `ai:recap:${userId}:`;
  const prefixWalletOptions = `ai:walletOptions:${userId}`;

  for (const key of store.keys()) {
    if (key.startsWith(prefixRecap) || key === prefixWalletOptions) {
      store.delete(key);
    }
  }
}

/**
 * Clears the entire AI read cache. Useful in tests or manual invalidation.
 */
export function clearAiReadCache(): void {
  store.clear();
}
