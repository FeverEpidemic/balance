import { describe, it, expect } from "vitest";
import {
  PREMIUM_MONTHLY_PRICE,
  PREMIUM_ANNUAL_PRICE,
  PREMIUM_MONTHLY_PRICE_FORMATTED,
  PREMIUM_ANNUAL_PRICE_FORMATTED,
  PREMIUM_ANNUAL_SAVINGS_PERCENT,
  buildSnapItemDetails,
  getPlanDisplayLabel,
  getSubscriptionDurationDays,
} from "@/lib/plan-pricing";

describe("pricing constants", () => {
  it("has correct monthly price", () => {
    expect(PREMIUM_MONTHLY_PRICE).toBe(29_000);
  });

  it("has correct annual price", () => {
    expect(PREMIUM_ANNUAL_PRICE).toBe(250_000);
  });

  it("has correct formatted prices", () => {
    expect(PREMIUM_MONTHLY_PRICE_FORMATTED).toBe("Rp 29.000");
    expect(PREMIUM_ANNUAL_PRICE_FORMATTED).toBe("Rp 250.000");
  });

  it("calculates savings percentage correctly", () => {
    // Monthly x 12 = 348.000, Annual = 250.000, savings ~28%
    expect(PREMIUM_ANNUAL_SAVINGS_PERCENT).toBe(28);
  });
});

describe("buildSnapItemDetails", () => {
  it("builds monthly item details", () => {
    const items = buildSnapItemDetails("monthly");
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("premium-monthly");
    expect(items[0].price).toBe(29_000);
    expect(items[0].quantity).toBe(1);
    expect(items[0].name).toBe("Premium Bulanan");
  });

  it("builds annual item details", () => {
    const items = buildSnapItemDetails("annual");
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("premium-annual");
    expect(items[0].price).toBe(250_000);
    expect(items[0].quantity).toBe(1);
    expect(items[0].name).toBe("Premium Tahunan");
  });
});

describe("getPlanDisplayLabel", () => {
  it("returns monthly label", () => {
    expect(getPlanDisplayLabel("monthly")).toBe("Premium Bulanan · Rp 29.000/bln");
  });

  it("returns annual label", () => {
    expect(getPlanDisplayLabel("annual")).toBe("Premium Tahunan · Rp 250.000/thn");
  });
});

describe("getSubscriptionDurationDays", () => {
  it("returns 30 days for monthly", () => {
    expect(getSubscriptionDurationDays("monthly")).toBe(30);
  });

  it("returns 365 days for annual", () => {
    expect(getSubscriptionDurationDays("annual")).toBe(365);
  });
});
