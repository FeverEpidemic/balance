import "server-only";
import { createClient } from "redis";

type Serializable = null | boolean | number | string | Serializable[] | { [key: string]: Serializable };
type CacheLoader<T> = () => Promise<T>;
type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX: number }): Promise<unknown>;
  del(keys: string[]): Promise<unknown>;
  scanIterator(options: { MATCH: string }): AsyncIterable<string>;
};
type CacheClientFactory = () => Promise<CacheClient | null>;
type RedisConnection = ReturnType<typeof createClient>;
type RedisCacheMetrics = {
  hits: number;
  misses: number;
  writes: number;
  readErrors: number;
  writeErrors: number;
  deleteErrors: number;
  invalidations: number;
};

const DEFAULT_REDIS_METRICS_INTERVAL_MS = 60_000;

function hasRedisUrl() {
  return Boolean(process.env.REDIS_URL?.trim());
}

export function isRedisEnabled() {
  if (!hasRedisUrl()) {
    return false;
  }

  const flag = process.env.REDIS_ENABLED?.trim().toLowerCase();

  if (!flag) {
    return true;
  }

  return !["0", "false", "off", "no"].includes(flag);
}

export function getRedisKeyPrefix() {
  return process.env.REDIS_KEY_PREFIX?.trim() || "balance";
}

function getRedisUrl() {
  return process.env.REDIS_URL?.trim() || null;
}

function isRedisMetricsEnabled() {
  const flag = process.env.REDIS_METRICS_ENABLED?.trim().toLowerCase();
  return ["1", "true", "on", "yes"].includes(flag ?? "");
}

function getRedisMetricsIntervalMs() {
  const value = Number(process.env.REDIS_METRICS_INTERVAL_MS ?? DEFAULT_REDIS_METRICS_INTERVAL_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_REDIS_METRICS_INTERVAL_MS;
}

let redisClient: RedisConnection | null = null;
let redisConnectPromise: Promise<CacheClient | null> | null = null;
let redisMetrics: RedisCacheMetrics = {
  hits: 0,
  misses: 0,
  writes: 0,
  readErrors: 0,
  writeErrors: 0,
  deleteErrors: 0,
  invalidations: 0
};
let lastRedisMetricsFlushAt = Date.now();

function logRedisEvent(level: "info" | "warn", message: string, details?: Record<string, unknown>) {
  if (!isRedisMetricsEnabled()) {
    return;
  }

  if (details) {
    console[level](`[redis-cache] ${message}`, details);
    return;
  }

  console[level](`[redis-cache] ${message}`);
}

function flushRedisMetricsIfDue() {
  if (!isRedisMetricsEnabled()) {
    return;
  }

  const now = Date.now();

  if (now - lastRedisMetricsFlushAt < getRedisMetricsIntervalMs()) {
    return;
  }

  lastRedisMetricsFlushAt = now;
  console.info("[redis-cache] metrics", {
    ...redisMetrics,
    enabled: isRedisEnabled(),
    keyPrefix: getRedisKeyPrefix()
  });
}

function trackRedisMetric(metric: keyof RedisCacheMetrics, amount = 1) {
  redisMetrics[metric] += amount;
  flushRedisMetricsIfDue();
}

export function getRedisMetricsSnapshot() {
  return { ...redisMetrics };
}

export function resetRedisMetrics() {
  redisMetrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    readErrors: 0,
    writeErrors: 0,
    deleteErrors: 0,
    invalidations: 0
  };
  lastRedisMetricsFlushAt = Date.now();
}

async function connectRedisClient() {
  const url = getRedisUrl();

  if (!url || !isRedisEnabled()) {
    return null;
  }

  const client = createClient({ url });
  client.on("error", (error) => {
    // Cache is best-effort. Ignore runtime errors and fall back to source data.
    trackRedisMetric("readErrors");
    logRedisEvent("warn", "runtime error", {
      error: error instanceof Error ? error.message : String(error)
    });
  });

  await client.connect();
  redisClient = client;
  logRedisEvent("info", "connected", { url });
  return client;
}

export async function getRedisClient(): Promise<CacheClient | null> {
  if (!isRedisEnabled()) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisConnectPromise) {
    return redisConnectPromise;
  }

  redisConnectPromise = connectRedisClient()
    .catch((error) => {
      redisClient = null;
      trackRedisMetric("readErrors");
      logRedisEvent("warn", "connect failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    })
    .finally(() => {
      redisConnectPromise = null;
    });

  return redisConnectPromise;
}

function qualifyKey(key: string) {
  return `${getRedisKeyPrefix()}:${key}`;
}

export function createRedisCache(getClient: CacheClientFactory = getRedisClient) {
  return {
    async getOrSet<T extends Serializable>(key: string, ttlSeconds: number, loader: CacheLoader<T>) {
      const client = await getClient();
      const qualifiedKey = qualifyKey(key);

      if (client) {
        try {
          const cached = await client.get(qualifiedKey);

          if (cached !== null) {
            trackRedisMetric("hits");
            return JSON.parse(cached) as T;
          }

          trackRedisMetric("misses");
        } catch {
          // Ignore cache read failures and keep serving fresh data.
          trackRedisMetric("readErrors");
          logRedisEvent("warn", "read failed", { key });
        }
      }

      const freshValue = await loader();

      if (client) {
        try {
          await client.set(qualifiedKey, JSON.stringify(freshValue), {
            EX: ttlSeconds
          });
          trackRedisMetric("writes");
        } catch {
          // Ignore cache write failures.
          trackRedisMetric("writeErrors");
          logRedisEvent("warn", "write failed", { key, ttlSeconds });
        }
      }

      return freshValue;
    },
    async del(key: string | string[]) {
      const client = await getClient();

      if (!client) {
        return;
      }

      const qualifiedKeys = (Array.isArray(key) ? key : [key]).map(qualifyKey);

      try {
        await client.del(qualifiedKeys);
        trackRedisMetric("invalidations", qualifiedKeys.length);
      } catch {
        // Ignore cache delete failures.
        trackRedisMetric("deleteErrors");
        logRedisEvent("warn", "delete failed", { key });
      }
    },
    async delByPrefixes(prefixes: string[]) {
      const client = await getClient();

      if (!client) {
        return;
      }

      const keysToDelete = new Set<string>();

      try {
        for (const prefix of prefixes) {
          for await (const key of client.scanIterator({
            MATCH: `${qualifyKey(prefix)}*`
          })) {
            keysToDelete.add(key);
          }
        }

        if (keysToDelete.size > 0) {
          await client.del([...keysToDelete]);
          trackRedisMetric("invalidations", keysToDelete.size);
        }
      } catch {
        // Ignore cache delete failures.
        trackRedisMetric("deleteErrors");
        logRedisEvent("warn", "delete by prefix failed", { prefixes });
      }
    }
  };
}

export const redisCache = createRedisCache();
