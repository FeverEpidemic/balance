import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRedisCache, getRedisMetricsSnapshot, resetRedisMetrics } from "@/lib/redis";
import {
  getBudgetsCacheKey,
  getDashboardCacheKey,
  getTransactionsCacheKey,
  getWalletOverviewCacheKey
} from "@/lib/data/cache";

type FakeScanOptions = {
  MATCH?: string;
};

function createFakeClient(initialState: Record<string, string> = {}) {
  const store = new Map(Object.entries(initialState));

  return {
    store,
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
    },
    async del(keys: string[]) {
      for (const key of keys) {
        store.delete(key);
      }
    },
    async *scanIterator(options?: FakeScanOptions) {
      const pattern = options?.MATCH ?? "*";
      const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;

      for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
          yield key;
        }
      }
    }
  };
}

describe("redis cache wrapper", () => {
  beforeEach(() => {
    resetRedisMetrics();
    delete process.env.REDIS_METRICS_ENABLED;
    delete process.env.REDIS_METRICS_INTERVAL_MS;
  });

  it("hydrates cache on first miss and reuses value on second hit", async () => {
    process.env.REDIS_KEY_PREFIX = "test";
    const fakeClient = createFakeClient();
    const cache = createRedisCache(async () => fakeClient);
    const loader = vi.fn(async () => ({ value: 42 }));

    const first = await cache.getOrSet("user:u1:dashboard", 60, loader);
    const second = await cache.getOrSet("user:u1:dashboard", 60, loader);

    expect(first).toEqual({ value: 42 });
    expect(second).toEqual({ value: 42 });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(fakeClient.store.get("test:user:u1:dashboard")).toBe(JSON.stringify({ value: 42 }));
    expect(getRedisMetricsSnapshot()).toMatchObject({
      hits: 1,
      misses: 1,
      writes: 1
    });
  });

  it("falls back to loader when redis read fails", async () => {
    const cache = createRedisCache(async () => ({
      async get() {
        throw new Error("redis down");
      },
      async set() {
        throw new Error("redis down");
      },
      async del() {},
      async *scanIterator() {}
    }));
    const loader = vi.fn(async () => ({ ok: true }));

    const result = await cache.getOrSet("user:u1:dashboard", 60, loader);

    expect(result).toEqual({ ok: true });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(getRedisMetricsSnapshot().readErrors).toBe(1);
  });

  it("deletes keys by prefix without touching other namespaces", async () => {
    process.env.REDIS_KEY_PREFIX = "balance";
    const fakeClient = createFakeClient({
      "balance:user:u1:dashboard": JSON.stringify({ totalBalance: 1 }),
      "balance:wallet:w1:user:u1:overview": JSON.stringify({ walletName: "A" }),
      "balance:wallet:w1:user:u2:transactions:2026-05": JSON.stringify([]),
      "balance:wallet:w2:user:u1:overview": JSON.stringify({ walletName: "B" })
    });
    const cache = createRedisCache(async () => fakeClient);

    await cache.delByPrefixes(["wallet:w1:"]);

    expect(fakeClient.store.has("balance:user:u1:dashboard")).toBe(true);
    expect(fakeClient.store.has("balance:wallet:w1:user:u1:overview")).toBe(false);
    expect(fakeClient.store.has("balance:wallet:w1:user:u2:transactions:2026-05")).toBe(false);
    expect(fakeClient.store.has("balance:wallet:w2:user:u1:overview")).toBe(true);
    expect(getRedisMetricsSnapshot().invalidations).toBe(2);
  });

  it("emits periodic metrics logs when enabled", async () => {
    process.env.REDIS_METRICS_ENABLED = "true";
    process.env.REDIS_METRICS_INTERVAL_MS = "1";
    const fakeClient = createFakeClient();
    const cache = createRedisCache(async () => fakeClient);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await cache.getOrSet("user:u1:dashboard", 60, async () => ({ ok: true }));
    await new Promise((resolve) => setTimeout(resolve, 2));
    await cache.getOrSet("user:u1:dashboard", 60, async () => ({ ok: false }));

    expect(infoSpy).toHaveBeenCalledWith(
      "[redis-cache] metrics",
      expect.objectContaining({
        hits: 1,
        misses: 1,
        writes: 1
      })
    );

    infoSpy.mockRestore();
  });
});

describe("cache key scoping", () => {
  it("builds user-scoped and wallet-scoped keys", () => {
    expect(getDashboardCacheKey("u1")).toBe("user:u1:dashboard");
    expect(getWalletOverviewCacheKey("u1", "w1")).toBe("wallet:w1:user:u1:overview");
    expect(getTransactionsCacheKey("u1", "w1", "2026-05")).toBe("wallet:w1:user:u1:transactions:2026-05");
    expect(getBudgetsCacheKey("u1", "w1", "2026-05")).toBe("wallet:w1:user:u1:budgets:2026-05");
  });
});
