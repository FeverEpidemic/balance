// lib/features.ts
// Central feature flag system for Balance.
//
// Self-hosted deployments (SELF_HOSTED_MODE=true) unlock ALL features.
// SaaS deployments (SELF_HOSTED_MODE=false) check subscription status.
//
// Usage:
//   import { isFeatureAvailable } from "@/lib/features";
//   if (isFeatureAvailable(userPlan, "ai_chat")) { ... }

import type { PlanType } from "@/lib/plan";

export type FeatureFlag =
  | "ai_chat"
  | "shared_wallets"
  | "unlimited_recurring"
  | "advanced_reports"
  | "pdf_export"
  | "multi_currency"
  | "unlimited_transactions";

type FeatureSet = Record<FeatureFlag, boolean>;

/**
 * Returns true if running in self-hosted mode.
 * Self-hosted = all features unlocked, no billing checks.
 *
 * Detection priority:
 *   1. Explicit SELF_HOSTED_MODE env var (true/false)
 *   2. Auto-detect: if Midtrans is not configured, force self-hosted
 *      This prevents a gimped experience if someone forgets to set it.
 */
export function isSelfHosted(): boolean {
  // 1. Explicit env var takes precedence
  const raw = process.env.SELF_HOSTED_MODE?.trim().toLowerCase();
  if (raw && ["true", "false", "1", "0", "on", "off", "yes", "no"].includes(raw)) {
    return ["true", "1", "on", "yes"].includes(raw);
  }

  // 2. Auto-detect: if billing (Midtrans) is not configured, force self-hosted.
  //    This prevents accidentally getting a limited free tier when self-hosting.
  const midtransKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!midtransKey || midtransKey.startsWith("your_")) {
    return true;
  }

  return false;
}

/**
 * Returns the base feature set available to free (non-subscribed) users.
 * When SELF_HOSTED_MODE=true, all features are free.
 * When SELF_HOSTED_MODE=false, only basic features are free.
 */
export function getFreeFeatures(): FeatureSet {
  if (isSelfHosted()) {
    return allFeaturesUnlocked();
  }

  return {
    ai_chat: false,
    shared_wallets: false,
    unlimited_recurring: false,
    advanced_reports: false,
    pdf_export: false,
    multi_currency: false,
    unlimited_transactions: false,
  };
}

/**
 * Returns the premium feature set for subscribed users.
 * On SaaS, this is what paying subscribers get.
 */
export function getPremiumFeatures(): FeatureSet {
  if (isSelfHosted()) {
    return allFeaturesUnlocked();
  }

  return allFeaturesUnlocked();
}

function allFeaturesUnlocked(): FeatureSet {
  return {
    ai_chat: true,
    shared_wallets: true,
    unlimited_recurring: true,
    advanced_reports: true,
    pdf_export: true,
    multi_currency: true,
    unlimited_transactions: true,
  };
}

/**
 * Check if a specific feature is available for the given plan.
 * Self-hosted mode bypasses all plan checks.
 *
 * @param plan - User's current plan ('free' | 'premium')
 * @param feature - The feature to check
 */
export function isFeatureAvailable(
  plan: PlanType | null | undefined,
  feature: FeatureFlag,
): boolean {
  if (isSelfHosted()) return true;
  if (!plan) return false;

  if (plan === "premium") {
    return getPremiumFeatures()[feature];
  }

  return getFreeFeatures()[feature];
}

// ── Helper: read boolean env var ──────────────────────────────────

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const rawValue = process.env[name]?.trim().toLowerCase();

  if (!rawValue) {
    return defaultValue;
  }

  if (["1", "true", "on", "yes"].includes(rawValue)) {
    return true;
  }

  if (["0", "false", "off", "no"].includes(rawValue)) {
    return false;
  }

  return defaultValue;
}
