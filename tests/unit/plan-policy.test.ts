import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlanPolicy, getReportHistoryMonths, canExportPdf, getEffectivePlanType, getTrialMeta } from "@/lib/plan";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn()
}));

function createAdminMock(planType: "free" | "premium", trialEndsAt: string | null = null) {
  const maybeSingle = vi.fn(async () => ({
    data: { plan_type: planType, trial_ends_at: trialEndsAt },
    error: null
  }));

  const admin = {
    from: vi.fn((_table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle }))
      }))
    }))
  };

  return { admin, maybeSingle };
}

describe("getEffectivePlanType", () => {
  it("returns free for free plan without trial", () => {
    expect(getEffectivePlanType("free", null)).toBe("free");
  });

  it("returns premium for free plan with active trial", () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(getEffectivePlanType("free", futureDate)).toBe("premium");
  });

  it("returns free for free plan with expired trial", () => {
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(getEffectivePlanType("free", pastDate)).toBe("free");
  });

  it("returns premium for premium plan regardless of trial", () => {
    expect(getEffectivePlanType("premium", null)).toBe("premium");
  });

  it("returns premium for premium plan even with expired trial fields", () => {
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(getEffectivePlanType("premium", pastDate)).toBe("premium");
  });
});

describe("getTrialMeta", () => {
  it("returns inactive trial for free plan without trial end", () => {
    const meta = getTrialMeta("free", null);
    expect(meta.isTrialActive).toBe(false);
    expect(meta.trialEndsAt).toBeNull();
    expect(meta.trialDaysRemaining).toBeNull();
  });

  it("returns active trial for free plan with future date", () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const meta = getTrialMeta("free", futureDate);
    expect(meta.isTrialActive).toBe(true);
    expect(meta.trialEndsAt).toBe(futureDate);
    expect(meta.trialDaysRemaining).toBeGreaterThan(0);
  });

  it("returns inactive trial for premium plan with future date", () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const meta = getTrialMeta("premium", futureDate);
    expect(meta.isTrialActive).toBe(false);
    expect(meta.trialEndsAt).toBeNull();
  });

  it("returns inactive trial for free plan with past date", () => {
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const meta = getTrialMeta("free", pastDate);
    expect(meta.isTrialActive).toBe(false);
    expect(meta.trialEndsAt).toBe(pastDate);
    expect(meta.trialDaysRemaining).toBeNull();
  });
});

describe("getPlanPolicy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.AI_CHAT_DAILY_LIMIT_MAX;
    delete process.env.AI_CHAT_RATE_LIMIT_MAX_REQUESTS;
  });

  it("returns free policy for a free user", async () => {
    const { admin } = createAdminMock("free");
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const policy = await getPlanPolicy("user-1");

    expect(policy.planType).toBe("free");
    expect(policy.aiChatDailyLimit).toBe(5); // default env value
    expect(policy.apiEndpointsBypassPlanLimits).toBe(true);
    expect(policy.trialMeta.isTrialActive).toBe(false);
  });

  it("returns premium policy for a premium user", async () => {
    const { admin } = createAdminMock("premium");
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const policy = await getPlanPolicy("user-1");

    expect(policy.planType).toBe("premium");
    expect(policy.aiChatDailyLimit).toBeNull();
    // Premium gets 3x the base rate-limit max (default 20)
    expect(policy.aiChatRateLimitMaxRequests).toBe(60);
    expect(policy.apiEndpointsBypassPlanLimits).toBe(true);
    expect(policy.trialMeta.isTrialActive).toBe(false);
  });

  it("returns premium policy for a free user with active trial", async () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { admin } = createAdminMock("free", futureDate);
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const policy = await getPlanPolicy("user-1");

    expect(policy.planType).toBe("premium");
    expect(policy.aiChatDailyLimit).toBeNull();
    expect(policy.trialMeta.isTrialActive).toBe(true);
    expect(policy.trialMeta.trialEndsAt).toBe(futureDate);
  });

  it("returns free policy for a free user with expired trial", async () => {
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { admin } = createAdminMock("free", pastDate);
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const policy = await getPlanPolicy("user-1");

    expect(policy.planType).toBe("free");
    expect(policy.aiChatDailyLimit).toBe(5);
    expect(policy.trialMeta.isTrialActive).toBe(false);
    expect(policy.trialMeta.trialEndsAt).toBe(pastDate);
  });

  it("falls back to free policy when admin client is null", async () => {
    vi.mocked(createAdminClient).mockReturnValue(null);

    const policy = await getPlanPolicy("user-1");

    expect(policy.planType).toBe("free");
    expect(policy.aiChatDailyLimit).toBe(5);
  });

  it("falls back to free policy when no row is returned", async () => {
    const maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle }))
        }))
      }))
    };
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const policy = await getPlanPolicy("user-1");

    expect(policy.planType).toBe("free");
    expect(policy.aiChatDailyLimit).toBe(5);
  });

  it("falls back to free policy on DB error", async () => {
    const maybeSingle = vi.fn(async () => ({ data: null, error: new Error("DB error") }));
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle }))
        }))
      }))
    };
    vi.mocked(createAdminClient).mockReturnValue(admin as never);

    const policy = await getPlanPolicy("user-1");

    expect(policy.planType).toBe("free");
    expect(policy.aiChatDailyLimit).toBe(5);
  });
});

describe("getReportHistoryMonths", () => {
  it("returns 3 for free plan", () => {
    expect(getReportHistoryMonths("free")).toBe(3);
  });

  it("returns 12 for premium plan", () => {
    expect(getReportHistoryMonths("premium")).toBe(12);
  });
});

describe("canExportPdf", () => {
  it("returns false for free plan", () => {
    expect(canExportPdf("free")).toBe(false);
  });

  it("returns true for premium plan", () => {
    expect(canExportPdf("premium")).toBe(true);
  });
});
