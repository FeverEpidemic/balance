import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyRateLimitHeaders,
  consumeAiChatRateLimit,
  consumeRateLimit,
  consumeTransactionRateLimit,
  resetInMemoryRateLimits
} from "@/lib/rate-limit";
import { redisCache } from "@/lib/redis";
import { NextResponse } from "next/server";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetInMemoryRateLimits();
  });

  it("allows requests until the configured limit", async () => {
    const incrementSpy = vi.spyOn(redisCache, "increment");
    let currentValue = 0;

    incrementSpy.mockImplementation(async () => {
      currentValue += 1;
      return currentValue;
    });

    const now = Date.UTC(2026, 5, 6, 10, 0, 0);

    for (let index = 1; index <= 60; index += 1) {
      const result = await consumeRateLimit({
        namespace: "rate-limit:chat",
        key: "key-1",
        limit: 60,
        windowSeconds: 60,
        now
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(60 - index);
      expect(result.usedRedis).toBe(true);
    }
  });

  it("blocks requests after the configured limit and returns reset metadata", async () => {
    vi.spyOn(redisCache, "increment").mockResolvedValue(61);

    const now = Date.UTC(2026, 5, 6, 10, 0, 15);
    const result = await consumeRateLimit({
      namespace: "rate-limit:chat",
      key: "key-1",
      limit: 60,
      windowSeconds: 60,
      now
    });

    expect(result).toEqual({
      allowed: false,
      limit: 60,
      remaining: 0,
      resetAt: Date.UTC(2026, 5, 6, 10, 1, 0),
      usedRedis: true
    });
  });

  it("resets the counter in a new window", async () => {
    const valuesByWindow = new Map<string, number>();
    vi.spyOn(redisCache, "increment").mockImplementation(async (key) => {
      const nextValue = (valuesByWindow.get(key) ?? 0) + 1;
      valuesByWindow.set(key, nextValue);
      return nextValue;
    });

    const firstWindowNow = Date.UTC(2026, 5, 6, 10, 0, 59);
    const secondWindowNow = Date.UTC(2026, 5, 6, 10, 1, 0);

    const firstWindow = await consumeRateLimit({
      namespace: "rate-limit:chat",
      key: "key-1",
      limit: 60,
      windowSeconds: 60,
      now: firstWindowNow
    });
    const secondWindow = await consumeRateLimit({
      namespace: "rate-limit:chat",
      key: "key-1",
      limit: 60,
      windowSeconds: 60,
      now: secondWindowNow
    });

    expect(firstWindow.remaining).toBe(59);
    expect(secondWindow.remaining).toBe(59);
    expect(firstWindow.resetAt).toBe(Date.UTC(2026, 5, 6, 10, 1, 0));
    expect(secondWindow.resetAt).toBe(Date.UTC(2026, 5, 6, 10, 2, 0));
  });

  it("falls back to an in-process counter when redis is unavailable", async () => {
    vi.spyOn(redisCache, "increment").mockResolvedValue(null);

    const now = Date.UTC(2026, 5, 6, 10, 0, 0);
    const options = { namespace: "rate-limit:chat", key: "key-fallback", limit: 2, windowSeconds: 60, now };

    const first = await consumeRateLimit(options);
    const second = await consumeRateLimit(options);
    const third = await consumeRateLimit(options);

    expect(first).toEqual({
      allowed: true,
      limit: 2,
      remaining: 1,
      resetAt: Date.UTC(2026, 5, 6, 10, 1, 0),
      usedRedis: false
    });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
    expect(third.usedRedis).toBe(false);
  });

  it("keeps in-process counters separate per key and per window", async () => {
    vi.spyOn(redisCache, "increment").mockResolvedValue(null);

    const now = Date.UTC(2026, 5, 6, 10, 0, 0);
    const base = { namespace: "rate-limit:chat", limit: 1, windowSeconds: 60 };

    await consumeRateLimit({ ...base, key: "user-a", now });
    const blocked = await consumeRateLimit({ ...base, key: "user-a", now });
    const otherUser = await consumeRateLimit({ ...base, key: "user-b", now });
    const nextWindow = await consumeRateLimit({ ...base, key: "user-a", now: now + 60_000 });

    expect(blocked.allowed).toBe(false);
    expect(otherUser.allowed).toBe(true);
    expect(nextWindow.allowed).toBe(true);
  });

  it("prefers redis over the in-process counter when redis answers", async () => {
    vi.spyOn(redisCache, "increment").mockResolvedValue(1);

    const now = Date.UTC(2026, 5, 6, 10, 0, 0);
    const options = { namespace: "rate-limit:chat", key: "key-redis", limit: 1, windowSeconds: 60, now };

    await consumeRateLimit(options);
    const result = await consumeRateLimit(options);

    expect(result.allowed).toBe(true);
    expect(result.usedRedis).toBe(true);
  });
});

describe("applyRateLimitHeaders", () => {
  it("adds standard headers to successful responses", () => {
    const response = applyRateLimitHeaders(
      NextResponse.json({ ok: true }),
      {
        allowed: true,
        limit: 60,
        remaining: 42,
        resetAt: Date.UTC(2026, 5, 6, 10, 1, 0),
        usedRedis: true
      },
      Date.UTC(2026, 5, 6, 10, 0, 15)
    );

    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("42");
    expect(response.headers.get("X-RateLimit-Reset")).toBe("1780740060");
    expect(response.headers.get("Retry-After")).toBeNull();
  });

  it("adds retry-after on blocked responses", () => {
    const response = applyRateLimitHeaders(
      NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      {
        allowed: false,
        limit: 60,
        remaining: 0,
        resetAt: Date.UTC(2026, 5, 6, 10, 1, 0),
        usedRedis: true
      },
      Date.UTC(2026, 5, 6, 10, 0, 15)
    );

    expect(response.headers.get("Retry-After")).toBe("45");
  });
});

describe("named rate limit helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRANSACTION_RATE_LIMIT_ENABLED;
    delete process.env.TRANSACTION_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.TRANSACTION_RATE_LIMIT_WINDOW_SECONDS;
    delete process.env.AI_CHAT_RATE_LIMIT_ENABLED;
    delete process.env.AI_CHAT_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.AI_CHAT_RATE_LIMIT_WINDOW_SECONDS;
  });

  it("returns an allow result when transaction rate limiting is disabled", async () => {
    process.env.TRANSACTION_RATE_LIMIT_ENABLED = "false";
    process.env.TRANSACTION_RATE_LIMIT_MAX_REQUESTS = "30";
    process.env.TRANSACTION_RATE_LIMIT_WINDOW_SECONDS = "60";

    const result = await consumeTransactionRateLimit("user-1", Date.UTC(2026, 5, 6, 10, 0, 15));

    expect(result).toEqual({
      allowed: true,
      limit: 30,
      remaining: 30,
      resetAt: Date.UTC(2026, 5, 6, 10, 1, 0),
      usedRedis: false
    });
  });

  it("uses the ai-chat namespace when consuming AI chat limits", async () => {
    process.env.AI_CHAT_RATE_LIMIT_ENABLED = "true";
    process.env.AI_CHAT_RATE_LIMIT_MAX_REQUESTS = "20";
    process.env.AI_CHAT_RATE_LIMIT_WINDOW_SECONDS = "60";
    const incrementSpy = vi.spyOn(redisCache, "increment").mockResolvedValue(1);

    const result = await consumeAiChatRateLimit("user-9", Date.UTC(2026, 5, 6, 10, 0, 15));

    expect(incrementSpy).toHaveBeenCalledWith("rate-limit:ai-chat:user-9:1780740000", 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });
});
