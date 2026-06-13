import "server-only";

import { getAiChatDailyLimitMax, getAiChatRateLimitMaxRequests } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** The tier a user is on. */
export type PlanType = "free" | "premium";

/** Derived policy that applies to a user based on their plan. */
export type PlanPolicy = {
  planType: PlanType;
  /** null = unlimited (premium). Daily chat limit for free users. */
  aiChatDailyLimit: number | null;
  /** Per-minute rate-limit ceiling (all plans get at least the base). */
  aiChatRateLimitMaxRequests: number;
  /**
   * API key endpoints intentionally bypass plan limits —
   * API integration is always free.
   */
  apiEndpointsBypassPlanLimits: true;
};

const FREE_POLICY: PlanPolicy = {
  planType: "free",
  aiChatDailyLimit: getAiChatDailyLimitMax(),
  aiChatRateLimitMaxRequests: getAiChatRateLimitMaxRequests(),
  apiEndpointsBypassPlanLimits: true
};

const PREMIUM_POLICY: PlanPolicy = {
  planType: "premium",
  aiChatDailyLimit: null,
  aiChatRateLimitMaxRequests: getAiChatRateLimitMaxRequests() * 3,
  apiEndpointsBypassPlanLimits: true
};

type PlanRow = {
  plan_type: PlanType;
};

/**
 * Reads the user's plan type from the database and returns the
 * corresponding policy.  Falls back to free on any error so that a
 * missing admin key or broken DB row never blocks the user from
 * core functionality.
 */
export async function getPlanPolicy(userId: string): Promise<PlanPolicy> {
  const admin = createAdminClient();

  if (!admin) {
    return FREE_POLICY;
  }

  const { data, error } = await admin
    .from("profiles")
    .select("plan_type")
    .eq("id", userId)
    .maybeSingle<PlanRow>();

  if (error || !data) {
    return FREE_POLICY;
  }

  return data.plan_type === "premium" ? PREMIUM_POLICY : FREE_POLICY;
}
