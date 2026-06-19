import "server-only";

export type SubscriptionPeriod = "monthly" | "annual";

export const PREMIUM_MONTHLY_PRICE = 29_000;
export const PREMIUM_ANNUAL_PRICE = 250_000;

export const PREMIUM_MONTHLY_PRICE_FORMATTED = "Rp 29.000";
export const PREMIUM_ANNUAL_PRICE_FORMATTED = "Rp 250.000";

/**
 * Annual savings vs monthly × 12.
 */
export const PREMIUM_ANNUAL_SAVINGS_PERCENT = Math.round(
  (1 - PREMIUM_ANNUAL_PRICE / (PREMIUM_MONTHLY_PRICE * 12)) * 100
);

type SnapItemDetail = {
  id: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
  merchant_name?: string;
};

/**
 * Build item_details array for Midtrans Snap API payload.
 */
export function buildSnapItemDetails(period: SubscriptionPeriod): SnapItemDetail[] {
  const price = period === "monthly" ? PREMIUM_MONTHLY_PRICE : PREMIUM_ANNUAL_PRICE;
  const name = period === "monthly" ? "Premium Bulanan" : "Premium Tahunan";

  return [
    {
      id: `premium-${period}`,
      price,
      quantity: 1,
      name,
      brand: "Balance",
      category: "Subscription",
    },
  ];
}

/**
 * Human-readable display label for a subscription period.
 */
export function getPlanDisplayLabel(period: SubscriptionPeriod): string {
  if (period === "monthly") {
    return `Premium Bulanan · ${PREMIUM_MONTHLY_PRICE_FORMATTED}/bln`;
  }
  return `Premium Tahunan · ${PREMIUM_ANNUAL_PRICE_FORMATTED}/thn`;
}

/**
 * Duration in days for a given subscription period.
 */
export function getSubscriptionDurationDays(period: SubscriptionPeriod): number {
  return period === "monthly" ? 30 : 365;
}
