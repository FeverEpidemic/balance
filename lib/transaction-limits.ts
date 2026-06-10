import "server-only";

import { getFreeTierMaxMonthlyTransactions } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type UserPlanRow = {
  plan_type: "free" | "premium";
  monthly_transaction_count: number;
  monthly_transaction_reset_at: string | null;
};

export type FreeTransactionLimitResult = {
  allowed: boolean;
  planType: "free" | "premium";
  monthlyCount: number;
  maxMonthlyTransactions: number;
};

export function getMonthlyTransactionWindowStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function shouldResetMonthlyTransactionCount(resetAt: string | null, now = new Date()) {
  if (!resetAt) {
    return true;
  }

  const parsedResetAt = new Date(resetAt);

  if (Number.isNaN(parsedResetAt.getTime())) {
    return true;
  }

  return (
    parsedResetAt.getUTCFullYear() !== now.getUTCFullYear() ||
    parsedResetAt.getUTCMonth() !== now.getUTCMonth()
  );
}

async function getPlanRow(userId: string) {
  const admin = createAdminClient();

  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("profiles")
    .select("plan_type, monthly_transaction_count, monthly_transaction_reset_at")
    .eq("id", userId)
    .maybeSingle<UserPlanRow>();

  if (error || !data) {
    return null;
  }

  return { admin, row: data };
}

async function resetMonthlyTransactionCount(admin: NonNullable<ReturnType<typeof createAdminClient>>, userId: string, now = new Date()) {
  const windowStart = getMonthlyTransactionWindowStart(now).toISOString();

  const { error } = await admin
    .from("profiles")
    .update({
      monthly_transaction_count: 0,
      monthly_transaction_reset_at: windowStart
    })
    .eq("id", userId);

  if (error) {
    return null;
  }

  return windowStart;
}

export async function checkFreeTransactionLimit(userId: string, now = new Date()): Promise<FreeTransactionLimitResult> {
  const maxMonthlyTransactions = getFreeTierMaxMonthlyTransactions();
  const planState = await getPlanRow(userId);

  if (!planState) {
    return {
      allowed: true,
      planType: "free",
      monthlyCount: 0,
      maxMonthlyTransactions
    };
  }

  let monthlyCount = planState.row.monthly_transaction_count ?? 0;
  const planType = planState.row.plan_type ?? "free";

  if (shouldResetMonthlyTransactionCount(planState.row.monthly_transaction_reset_at, now)) {
    const nextResetAt = await resetMonthlyTransactionCount(planState.admin, userId, now);

    if (nextResetAt) {
      monthlyCount = 0;
    }
  }

  if (planType !== "free") {
    return {
      allowed: true,
      planType,
      monthlyCount,
      maxMonthlyTransactions
    };
  }

  return {
    allowed: monthlyCount < maxMonthlyTransactions,
    planType,
    monthlyCount,
    maxMonthlyTransactions
  };
}

export async function incrementTransactionCount(userId: string, now = new Date()) {
  const planState = await getPlanRow(userId);

  if (!planState) {
    return false;
  }

  let nextCount = planState.row.monthly_transaction_count ?? 0;
  let nextResetAt = planState.row.monthly_transaction_reset_at;

  if (shouldResetMonthlyTransactionCount(nextResetAt, now)) {
    nextCount = 0;
    nextResetAt = getMonthlyTransactionWindowStart(now).toISOString();
  }

  const { error } = await planState.admin
    .from("profiles")
    .update({
      monthly_transaction_count: nextCount + 1,
      monthly_transaction_reset_at: nextResetAt ?? getMonthlyTransactionWindowStart(now).toISOString()
    })
    .eq("id", userId);

  return !error;
}
