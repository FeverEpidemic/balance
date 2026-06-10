import "server-only";
import {
  getAiChatRateLimitEnabled,
  getAiChatRateLimitMaxRequests,
  getAiChatRateLimitWindowSeconds,
  getChatApiRateLimitEnabled,
  getChatApiRateLimitMaxRequests,
  getChatApiRateLimitWindowSeconds,
  getTransactionRateLimitEnabled,
  getTransactionRateLimitMaxRequests,
  getTransactionRateLimitWindowSeconds
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

export async function consumeRateLimit(options: ConsumeRateLimitOptions): Promise<RateLimitResult> {
  const now = options.now ?? Date.now();
  const currentEpochSeconds = Math.floor(now / 1000);
  const windowStart = currentEpochSeconds - (currentEpochSeconds % options.windowSeconds);
  const resetAt = (windowStart + options.windowSeconds) * 1000;

  const fallbackResult: RateLimitResult = {
    allowed: true,
    limit: options.limit,
    remaining: options.limit,
    resetAt,
    usedRedis: false
  };

  const currentCount = await redisCache.increment(
    `${options.namespace}:${options.key}:${windowStart}`,
    options.windowSeconds
  );

  if (currentCount === null) {
    return fallbackResult;
  }

  const remaining = Math.max(options.limit - currentCount, 0);

  return {
    allowed: currentCount <= options.limit,
    limit: options.limit,
    remaining,
    resetAt,
    usedRedis: true
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

export function applyRateLimitHeaders(response: Response, result: RateLimitResult, now = Date.now()) {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.floor(result.resetAt / 1000)));

  if (!result.allowed) {
    response.headers.set("Retry-After", String(Math.max(0, Math.ceil((result.resetAt - now) / 1000))));
  }

  return response;
}
