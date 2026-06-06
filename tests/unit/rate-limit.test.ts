import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/rate-limit";
import { redisCache } from "@/lib/redis";
import { NextResponse } from "next/server";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

  it("fails open when redis is unavailable", async () => {
    vi.spyOn(redisCache, "increment").mockResolvedValue(null);

    const result = await consumeRateLimit({
      namespace: "rate-limit:chat",
      key: "key-1",
      limit: 60,
      windowSeconds: 60,
      now: Date.UTC(2026, 5, 6, 10, 0, 0)
    });

    expect(result).toEqual({
      allowed: true,
      limit: 60,
      remaining: 60,
      resetAt: Date.UTC(2026, 5, 6, 10, 1, 0),
      usedRedis: false
    });
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
