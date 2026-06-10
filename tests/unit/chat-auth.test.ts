import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, getPeriodRange, getPreviousPeriodRange } from "@/lib/chat-auth";

describe("generateApiKey", () => {
  it("returns a key with the bal_ prefix", () => {
    const { rawKey } = generateApiKey();
    expect(rawKey.startsWith("bal_")).toBe(true);
  });

  it("returns a key that is longer than the prefix", () => {
    const { rawKey } = generateApiKey();
    expect(rawKey.length).toBeGreaterThan(8);
  });

  it("returns a unique key each call", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.rawKey).not.toBe(b.rawKey);
    expect(a.keyHash).not.toBe(b.keyHash);
  });

  it("returns a keyPrefix of 12 characters", () => {
    const { keyPrefix } = generateApiKey();
    expect(keyPrefix.length).toBe(12);
    expect(keyPrefix.startsWith("bal_")).toBe(true);
  });

  it("hashes consistently with hashApiKey", () => {
    const { rawKey, keyHash } = generateApiKey();
    expect(hashApiKey(rawKey)).toBe(keyHash);
  });
});

describe("hashApiKey", () => {
  it("produces a 64-character hex string (SHA-256)", () => {
    const hash = hashApiKey("bal_testkey123");
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });

  it("is deterministic", () => {
    const key = "bal_consistent_test";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("produces different hashes for different keys", () => {
    expect(hashApiKey("bal_key_a")).not.toBe(hashApiKey("bal_key_b"));
  });
});

describe("getPeriodRange", () => {
  it("day range starts at midnight and ends at end of day", () => {
    const { start, end } = getPeriodRange("day");
    const startDate = new Date(start);
    const endDate = new Date(end);
    expect(startDate.getUTCHours()).toBe(0);
    expect(startDate.getUTCMinutes()).toBe(0);
    expect(endDate.getUTCHours()).toBe(23);
    expect(endDate.getUTCMinutes()).toBe(59);
    expect(startDate.toISOString().slice(0, 10)).toBe(endDate.toISOString().slice(0, 10));
  });

  it("week range starts on Monday", () => {
    const { start } = getPeriodRange("week");
    const startDate = new Date(start);
    expect(startDate.getUTCDay()).toBe(1);
    expect(startDate.getUTCHours()).toBe(0);
  });

  it("month range starts at first day of month", () => {
    const { start } = getPeriodRange("month");
    const startDate = new Date(start);
    expect(startDate.getUTCDate()).toBe(1);
    const now = new Date();
    expect(startDate.getUTCMonth()).toBe(now.getUTCMonth());
    expect(startDate.getUTCFullYear()).toBe(now.getUTCFullYear());
  });

  it("month range end is today end of day", () => {
    const { end } = getPeriodRange("month");
    const endDate = new Date(end);
    const now = new Date();
    expect(endDate.getUTCDate()).toBe(now.getUTCDate());
    expect(endDate.getUTCFullYear()).toBe(now.getUTCFullYear());
  });

  it("all ranges have valid ISO strings", () => {
    const periods: Array<"day" | "week" | "month"> = ["day", "week", "month"];
    periods.forEach((period) => {
      const { start, end } = getPeriodRange(period);
      expect(() => new Date(start)).not.toThrow();
      expect(() => new Date(end)).not.toThrow();
      expect(new Date(start).getTime()).toBeLessThanOrEqual(new Date(end).getTime());
    });
  });
});

describe("getPreviousPeriodRange", () => {
  it("returns yesterday for day period", () => {
    const { start, end } = getPreviousPeriodRange("day", new Date("2026-06-10T12:00:00.000Z"));
    expect(start).toBe("2026-06-09T00:00:00.000Z");
    expect(end).toBe("2026-06-09T23:59:59.999Z");
  });

  it("returns previous comparable week window", () => {
    const { start, end } = getPreviousPeriodRange("week", new Date("2026-06-10T12:00:00.000Z"));
    expect(start).toBe("2026-06-01T00:00:00.000Z");
    expect(end).toBe("2026-06-03T23:59:59.999Z");
  });

  it("returns previous comparable month window", () => {
    const { start, end } = getPreviousPeriodRange("month", new Date("2026-06-10T12:00:00.000Z"));
    expect(start).toBe("2026-05-01T00:00:00.000Z");
    expect(end).toBe("2026-05-10T23:59:59.999Z");
  });
});
