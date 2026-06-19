import { isSelfHosted } from "@/lib/features";
import "server-only";

import { getAiChatDailyLimitMax, getAiChatRateLimitMaxRequests, getVisionDailyLimitFree } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** The tier a user is on. */
export type PlanType = "free" | "premium";

/** Trial metadata for the current user. */
export type TrialMeta = {
  isTrialActive: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
};

/**
 * Returns the effective plan type considering both the stored plan_type
 * and an active trial. A user with plan_type "free" who still has a valid
 * trial gets treated as "premium".
 *
 * Pure synchronous function — no DB access.
 */
export function getEffectivePlanType(
  planType: PlanType,
  trialEndsAt: string | null
): PlanType {
  if (planType === "premium") {
    return "premium";
  }

  if (trialEndsAt && new Date(trialEndsAt).getTime() > Date.now()) {
    return "premium";
  }

  return "free";
}

/**
 * Compute trial metadata from plan type and trial end date.
 * Pure synchronous function — no DB access.
 */
export function getTrialMeta(
  planType: PlanType,
  trialEndsAt: string | null
): TrialMeta {
  if (!trialEndsAt || planType === "premium") {
    return { isTrialActive: false, trialEndsAt: null, trialDaysRemaining: null };
  }

  const now = Date.now();
  const trialEnd = new Date(trialEndsAt).getTime();
  const diffMs = trialEnd - now;

  if (diffMs <= 0) {
    return { isTrialActive: false, trialEndsAt, trialDaysRemaining: null };
  }

  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return { isTrialActive: true, trialEndsAt, trialDaysRemaining: diffDays };
}

/** Returns the number of months of report history available for the given plan. */
export function getReportHistoryMonths(planType: PlanType): number {
  return planType === "premium" ? 12 : 3;
}

/** Whether PDF export is available for the given plan. */
export function canExportPdf(planType: PlanType): boolean {
  return planType === "premium";
}

/** Derived policy that applies to a user based on their plan. */
export type PlanPolicy = {
  planType: PlanType;
  trialMeta: TrialMeta;
  /** null = unlimited (premium). Daily chat limit for free users. */
  aiChatDailyLimit: number | null;
  /** Per-minute rate-limit ceiling (all plans get at least the base). */
  aiChatRateLimitMaxRequests: number;
  /** Daily OCR scan limit (free users get 3, premium 20, self-hosted null). */
  ocrScanDailyLimit: number | null;
  /**
   * API key endpoints intentionally bypass plan limits —
   * API integration is always free.
   */
  apiEndpointsBypassPlanLimits: true;
};

type PlanRow = {
  plan_type: PlanType;
  trial_ends_at: string | null;
};

const FREE_POLICY: Omit<PlanPolicy, "trialMeta"> = {
  planType: "free",
  aiChatDailyLimit: getAiChatDailyLimitMax(),
  aiChatRateLimitMaxRequests: getAiChatRateLimitMaxRequests(),
  ocrScanDailyLimit: getVisionDailyLimitFree(),
  apiEndpointsBypassPlanLimits: true
};

const PREMIUM_POLICY: Omit<PlanPolicy, "trialMeta"> = {
  planType: "premium",
  aiChatDailyLimit: null,
  aiChatRateLimitMaxRequests: getAiChatRateLimitMaxRequests() * 3,
  ocrScanDailyLimit: 20,
  apiEndpointsBypassPlanLimits: true
};

/**
 * Reads the user's plan type from the database and returns the
 * corresponding policy.  Falls back to free on any error so that a
 * missing admin key or broken DB row never blocks the user from
 * core functionality.
 */
export async function getPlanPolicy(userId: string): Promise<PlanPolicy> {
  if (isSelfHosted()) {
    return {
      ...PREMIUM_POLICY,
      trialMeta: { isTrialActive: false, trialEndsAt: null, trialDaysRemaining: null },
      planType: "premium",
    };
  }

  const admin = createAdminClient();

  if (!admin) {
    return { ...FREE_POLICY, trialMeta: { isTrialActive: false, trialEndsAt: null, trialDaysRemaining: null }, planType: "free" };
  }

  const { data, error } = await admin
    .from("profiles")
    .select("plan_type, trial_ends_at")
    .eq("id", userId)
    .maybeSingle<PlanRow>();

  if (error || !data) {
    return { ...FREE_POLICY, trialMeta: { isTrialActive: false, trialEndsAt: null, trialDaysRemaining: null }, planType: "free" };
  }

  const effectivePlan = getEffectivePlanType(data.plan_type, data.trial_ends_at);
  const trialMeta = getTrialMeta(data.plan_type, data.trial_ends_at);
  const basePolicy = effectivePlan === "premium" ? PREMIUM_POLICY : FREE_POLICY;

  return { ...basePolicy, planType: effectivePlan, trialMeta };
}
