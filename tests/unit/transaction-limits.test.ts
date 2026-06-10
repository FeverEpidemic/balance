import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkFreeTransactionLimit,
  getMonthlyTransactionWindowStart,
  incrementTransactionCount,
  shouldResetMonthlyTransactionCount
} from "@/lib/transaction-limits";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn()
}));

function createAdminMock(initialRow: {
  plan_type: "free" | "premium";
  monthly_transaction_count: number;
  monthly_transaction_reset_at: string | null;
}) {
  let row = { ...initialRow };

  const maybeSingle = vi.fn(async () => ({ data: { ...row }, error: null }));
  const selectBuilder = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle
  };

  const updateBuilder = {
    eq: vi.fn(async (_field: string, _value: string) => ({ error: null }))
  };

  const admin = {
    from: vi.fn((table: string) => {
      expect(table).toBe("profiles");

      return {
        select: vi.fn(() => selectBuilder),
        update: vi.fn((payload: Partial<typeof row>) => {
          row = { ...row, ...payload };
          return updateBuilder;
        })
      };
    })
  };

  return {
    admin,
    getRow: () => row,
    maybeSingle
  };
}

describe("transaction limits", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.FREE_TIER_MAX_MONTHLY_TRANSACTIONS;
  });

  it("resets the counter when the stored month is stale", async () => {
    const now = new Date(Date.UTC(2026, 5, 10, 8, 0, 0));
    const adminMock = createAdminMock({
      plan_type: "free",
      monthly_transaction_count: 18,
      monthly_transaction_reset_at: "2026-05-01T00:00:00.000Z"
    });
    vi.mocked(createAdminClient).mockReturnValue(adminMock.admin as never);

    const result = await checkFreeTransactionLimit("user-1", now);

    expect(result).toEqual({
      allowed: true,
      planType: "free",
      monthlyCount: 0,
      maxMonthlyTransactions: 20
    });
    expect(adminMock.getRow().monthly_transaction_count).toBe(0);
    expect(adminMock.getRow().monthly_transaction_reset_at).toBe("2026-06-01T00:00:00.000Z");
  });

  it("blocks free users who already reached the monthly cap", async () => {
    process.env.FREE_TIER_MAX_MONTHLY_TRANSACTIONS = "20";
    const adminMock = createAdminMock({
      plan_type: "free",
      monthly_transaction_count: 20,
      monthly_transaction_reset_at: "2026-06-01T00:00:00.000Z"
    });
    vi.mocked(createAdminClient).mockReturnValue(adminMock.admin as never);

    const result = await checkFreeTransactionLimit("user-1", new Date(Date.UTC(2026, 5, 10, 8, 0, 0)));

    expect(result.allowed).toBe(false);
    expect(result.monthlyCount).toBe(20);
  });

  it("always allows premium users", async () => {
    const adminMock = createAdminMock({
      plan_type: "premium",
      monthly_transaction_count: 999,
      monthly_transaction_reset_at: "2026-06-01T00:00:00.000Z"
    });
    vi.mocked(createAdminClient).mockReturnValue(adminMock.admin as never);

    const result = await checkFreeTransactionLimit("user-1", new Date(Date.UTC(2026, 5, 10, 8, 0, 0)));

    expect(result.allowed).toBe(true);
    expect(result.planType).toBe("premium");
  });

  it("increments the active monthly counter", async () => {
    const adminMock = createAdminMock({
      plan_type: "free",
      monthly_transaction_count: 3,
      monthly_transaction_reset_at: "2026-06-01T00:00:00.000Z"
    });
    vi.mocked(createAdminClient).mockReturnValue(adminMock.admin as never);

    const success = await incrementTransactionCount("user-1", new Date(Date.UTC(2026, 5, 10, 8, 0, 0)));

    expect(success).toBe(true);
    expect(adminMock.getRow().monthly_transaction_count).toBe(4);
  });
});

describe("transaction limit date helpers", () => {
  it("returns the UTC month window start", () => {
    expect(getMonthlyTransactionWindowStart(new Date(Date.UTC(2026, 5, 10, 8, 15, 0))).toISOString()).toBe(
      "2026-06-01T00:00:00.000Z"
    );
  });

  it("detects when a monthly counter should reset", () => {
    const now = new Date(Date.UTC(2026, 5, 10, 8, 0, 0));

    expect(shouldResetMonthlyTransactionCount(null, now)).toBe(true);
    expect(shouldResetMonthlyTransactionCount("2026-05-01T00:00:00.000Z", now)).toBe(true);
    expect(shouldResetMonthlyTransactionCount("2026-06-01T00:00:00.000Z", now)).toBe(false);
  });
});
