import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlanPolicy, getReportHistoryMonths, canExportPdf } from "@/lib/plan";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn()
}));

function createAdminMock(planType: "free" | "premium") {
  const maybeSingle = vi.fn(async () => ({
    data: { plan_type: planType },
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
