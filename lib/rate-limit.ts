import "server-only";
import {
  getAiChatRateLimitEnabled,
  getAiChatRateLimitMaxRequests,
  getAiChatRateLimitWindowSeconds,
  getAiChatDailyLimitEnabled,
  getAiChatDailyLimitMax,
  getChatApiRateLimitEnabled,
  getChatApiRateLimitMaxRequests,
  getChatApiRateLimitWindowSeconds,
  getTransactionRateLimitEnabled,
  getTransactionRateLimitMaxRequests,
  getTransactionRateLimitWindowSeconds,
  getVisionDailyLimitFree,
} from "@/lib/env";
import { redisCache } from "@/lib/redis";

type ConsumeRateLimitOptions = {
  namespace: string;
  key: string;
  limit: number;
  windowSeconds: number;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  usedRedis: boolean;
};

type MemoryCounter = {
  count: number;
  expiresAt: number;
};

/**
 * In-process counters used when Redis is disabled or unreachable.
 *
 * Redis stays the source of truth whenever it is available. Without it the
 * limits used to be skipped entirely, which also switched off login throttling
 * and the AI quotas. This fallback keeps them enforced per server process: the
 * counters are not shared between instances and reset on restart, so it is
 * weaker than Redis, but an outage no longer removes every limit.
 */
const MEMORY_COUNTER_MAX_KEYS = 10_000;
const memoryCounters = new Map<string, MemoryCounter>();

function pruneMemoryCounters(now: number) {
  for (const [key, counter] of memoryCounters) {
    if (counter.expiresAt <= now) {
      memoryCounters.delete(key);
    }
  }

  // Still full of live windows: drop the oldest entries so memory stays bounded.
  for (const key of memoryCounters.keys()) {
    if (memoryCounters.size < MEMORY_COUNTER_MAX_KEYS) {
      break;
    }

    memoryCounters.delete(key);
  }
}

function incrementInMemory(key: string, expiresAt: number, now: number) {
  const existing = memoryCounters.get(key);

  if (existing && existing.expiresAt > now) {
    existing.count += 1;
    return existing.count;
  }

  if (memoryCounters.size >= MEMORY_COUNTER_MAX_KEYS) {
    pruneMemoryCounters(now);
  }

  memoryCounters.set(key, { count: 1, expiresAt });
  return 1;
}

/** Clears the in-process fallback counters. Intended for tests. */
export function resetInMemoryRateLimits() {
  memoryCounters.clear();
}

export async function consumeRateLimit(options: ConsumeRateLimitOptions): Promise<RateLimitResult> {
  const now = options.now ?? Date.now();
  const currentEpochSeconds = Math.floor(now / 1000);
  const windowStart = currentEpochSeconds - (currentEpochSeconds % options.windowSeconds);
  const resetAt = (windowStart + options.windowSeconds) * 1000;
  const counterKey = `${options.namespace}:${options.key}:${windowStart}`;

  const redisCount = await redisCache.increment(counterKey, options.windowSeconds);
  const usedRedis = redisCount !== null;
  const currentCount = redisCount ?? incrementInMemory(counterKey, resetAt, now);

  return {
    allowed: currentCount <= options.limit,
    limit: options.limit,
    remaining: Math.max(options.limit - currentCount, 0),
    resetAt,
    usedRedis
  };
}

export function isChatApiRateLimitEnabled() {
  return getChatApiRateLimitEnabled();
}

export async function consumeChatApiRateLimit(keyId: string, now?: number) {
  if (!isChatApiRateLimitEnabled()) {
    const windowSeconds = getChatApiRateLimitWindowSeconds();
    const currentEpochSeconds = Math.floor((now ?? Date.now()) / 1000);
    const windowStart = currentEpochSeconds - (currentEpochSeconds % windowSeconds);

    return {
      allowed: true,
      limit: getChatApiRateLimitMaxRequests(),
      remaining: getChatApiRateLimitMaxRequests(),
      resetAt: (windowStart + windowSeconds) * 1000,
      usedRedis: false
    } satisfies RateLimitResult;
  }

  return consumeRateLimit({
    namespace: "rate-limit:chat",
    key: keyId,
    limit: getChatApiRateLimitMaxRequests(),
    windowSeconds: getChatApiRateLimitWindowSeconds(),
    now
  });
}

function buildAllowedFallback(limit: number, windowSeconds: number, now = Date.now()) {
  const currentEpochSeconds = Math.floor(now / 1000);
  const windowStart = currentEpochSeconds - (currentEpochSeconds % windowSeconds);

  return {
    allowed: true,
    limit,
    remaining: limit,
    resetAt: (windowStart + windowSeconds) * 1000,
    usedRedis: false
  } satisfies RateLimitResult;
}

export async function consumeTransactionRateLimit(userId: string, now?: number) {
  if (!getTransactionRateLimitEnabled()) {
    return buildAllowedFallback(getTransactionRateLimitMaxRequests(), getTransactionRateLimitWindowSeconds(), now);
  }

  return consumeRateLimit({
    namespace: "rate-limit:transaction",
    key: userId,
    limit: getTransactionRateLimitMaxRequests(),
    windowSeconds: getTransactionRateLimitWindowSeconds(),
    now
  });
}

export async function consumeAiChatRateLimit(userId: string, now?: number) {
  if (!getAiChatRateLimitEnabled()) {
    return buildAllowedFallback(getAiChatRateLimitMaxRequests(), getAiChatRateLimitWindowSeconds(), now);
  }

  return consumeRateLimit({
    namespace: "rate-limit:ai-chat",
    key: userId,
    limit: getAiChatRateLimitMaxRequests(),
    windowSeconds: getAiChatRateLimitWindowSeconds(),
    now
  });
}

export async function consumeAiChatDailyLimit(userId: string, now?: number) {
  if (!getAiChatDailyLimitEnabled()) {
    return buildAllowedFallback(getAiChatDailyLimitMax(), 86400, now);
  }

  return consumeRateLimit({
    namespace: "rate-limit:ai-chat-daily",
    key: userId,
    limit: getAiChatDailyLimitMax(),
    windowSeconds: 86400,
    now
  });
}

export async function consumeLoginRateLimit(ip: string, now?: number) {
  const limit = 5;
  const windowSeconds = 15 * 60; // 15 minutes

  return consumeRateLimit({
    namespace: "rate-limit:auth-login",
    key: ip,
    limit,
    windowSeconds,
    now
  });
}

/** Per-user daily OCR scan limit. Keyed on namespace so it's independent of AI chat counters. */
export async function consumeOcrDailyLimit(userId: string, limit: number, now?: number) {
  if (limit === Infinity || limit <= 0) {
    return buildAllowedFallback(Infinity, 86400, now);
  }

  return consumeRateLimit({
    namespace: "rate-limit:ocr-daily",
    key: userId,
    limit,
    windowSeconds: 86400,
    now
  });
}

/** Per-user per-minute OCR rate limit (1 scan per 10 seconds = 6 scans/minute). */
export async function consumeOcrRateLimit(userId: string, now?: number) {
  return consumeRateLimit({
    namespace: "rate-limit:ocr",
    key: userId,
    limit: 1,
    windowSeconds: 10,
    now
  });
}

export function applyRateLimitHeaders(response: Response, result: RateLimitResult, now = Date.now()) {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.floor(result.resetAt / 1000)));

  if (!result.allowed) {
    response.headers.set("Retry-After", String(Math.max(0, Math.ceil((result.resetAt - now) / 1000))));
  }

  return response;
}

export function applyDailyLimitHeaders(response: Response, result: RateLimitResult, now = Date.now()) {
  response.headers.set("X-DailyLimit-Limit", String(result.limit));
  response.headers.set("X-DailyLimit-Remaining", String(result.remaining));
  response.headers.set("X-DailyLimit-Reset", String(Math.floor(result.resetAt / 1000)));

  if (!result.allowed) {
    response.headers.set("Retry-After", String(Math.max(0, Math.ceil((result.resetAt - now) / 1000))));
  }

  return response;
}
