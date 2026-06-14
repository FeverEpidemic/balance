import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  queryCurrentUserWalletIdsMock,
  queryWalletsMock,
  queryTransactionsMock,
  queryCategoriesMock,
  queryBudgetsMock,
  createClientMock,
  consumeTransactionRateLimitMock,
  invalidateWalletReadCachesMock,
  invalidateAiInsightCacheMock,
  invalidateAiReadCacheMock,
  getActionTranslatorMock,
  getWalletMemberUserIdsMock,
  revalidateWalletPathsMock
} = vi.hoisted(() => ({
  queryCurrentUserWalletIdsMock: vi.fn(),
  queryWalletsMock: vi.fn(),
  queryTransactionsMock: vi.fn(),
  queryCategoriesMock: vi.fn(),
  queryBudgetsMock: vi.fn(),
  createClientMock: vi.fn(),
  consumeTransactionRateLimitMock: vi.fn(),
  invalidateWalletReadCachesMock: vi.fn(),
  invalidateAiInsightCacheMock: vi.fn(),
  invalidateAiReadCacheMock: vi.fn(),
  getActionTranslatorMock: vi.fn(),
  getWalletMemberUserIdsMock: vi.fn(),
  revalidateWalletPathsMock: vi.fn()
}));

vi.mock("@/lib/data/queries", () => ({
  queryCurrentUserWalletIds: queryCurrentUserWalletIdsMock,
  queryWallets: queryWalletsMock,
  queryTransactions: queryTransactionsMock,
  queryCategories: queryCategoriesMock,
  queryBudgets: queryBudgetsMock
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeTransactionRateLimit: consumeTransactionRateLimitMock
}));

vi.mock("@/lib/data/cache", () => ({
  invalidateWalletReadCaches: invalidateWalletReadCachesMock,
  invalidateAiInsightCache: invalidateAiInsightCacheMock
}));

vi.mock("@/lib/ai/cache", () => ({
  invalidateAiReadCache: invalidateAiReadCacheMock
}));

vi.mock("@/app/actions/_shared", () => ({
  getActionTranslator: getActionTranslatorMock,
  getWalletMemberUserIds: getWalletMemberUserIdsMock,
  revalidateWalletPaths: revalidateWalletPathsMock
}));

vi.mock("@/lib/chat-auth", () => ({
  getPeriodRange: vi.fn(() => ({
    start: "2026-06-01T00:00:00.000Z",
    end: "2026-06-30T23:59:59.999Z"
  })),
  getPreviousPeriodRange: vi.fn(() => ({
    start: "2026-05-01T00:00:00.000Z",
    end: "2026-05-31T23:59:59.999Z"
  }))
}));

vi.mock("@/lib/finance", () => ({
  getCurrentMonthKey: vi.fn(() => "2026-06")
}));

import { createTransactionViaAi, getCategoryFocusForUser } from "@/lib/ai/data";

function createInsertClient(data: {
  id: string;
  wallet_id: string;
  category_id: string | null;
  kind: "income" | "expense";
  amount: number;
  happened_at: string;
  note: string | null;
  source: "manual";
}) {
  return {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data, error: null })
        }))
      }))
    }))
  };
}

describe("createTransactionViaAi", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    queryCurrentUserWalletIdsMock.mockResolvedValue([
      { wallet_id: "wallet-1", role: "owner" }
    ]);
    queryWalletsMock.mockResolvedValue([
      { id: "wallet-1", name: "Dompet Utama", kind: "personal" }
    ]);
    queryCategoriesMock.mockResolvedValue([]);
    consumeTransactionRateLimitMock.mockResolvedValue({ allowed: true });
    getActionTranslatorMock.mockResolvedValue((key: string) => {
      if (key === "actionErrors.transactionCategoryNotFound") {
        return "Kategori tidak ditemukan";
      }

      if (key === "actionSuccess.transactionSaved") {
        return "Transaksi berhasil disimpan.";
      }

      return key;
    });
    getWalletMemberUserIdsMock.mockResolvedValue(["user-1"]);
    createClientMock.mockReturnValue(createInsertClient({
      id: "tx-1",
      wallet_id: "wallet-1",
      category_id: null,
      kind: "expense",
      amount: 15000,
      happened_at: "2026-06-13T10:00:00.000Z",
      note: "GoFood",
      source: "manual"
    }));
  });

  it("returns CATEGORY_NOT_FOUND when categoryName is provided but cannot be resolved", async () => {
    const result = await createTransactionViaAi("user-1", {
      walletId: "wallet-1",
      kind: "expense",
      amount: 15000,
      categoryName: "Nasi Goreng",
      note: "GoFood"
    });

    expect(result).toEqual({
      ok: false,
      code: "CATEGORY_NOT_FOUND",
      message: "Kategori tidak ditemukan"
    });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("still allows uncategorized transactions when no categoryId and no categoryName are provided", async () => {
    const result = await createTransactionViaAi("user-1", {
      walletId: "wallet-1",
      kind: "expense",
      amount: 15000,
      note: "GoFood"
    });

    expect(result.ok).toBe(true);
    expect(result.transaction?.categoryId).toBeNull();
    expect(result.transaction?.categoryName).toBe("Tanpa kategori");
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});

describe("getCategoryFocusForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    queryCurrentUserWalletIdsMock.mockResolvedValue([
      { wallet_id: "wallet-1", role: "owner" }
    ]);
    queryWalletsMock.mockResolvedValue([
      { id: "wallet-1", name: "Dompet Utama", kind: "personal" }
    ]);
    queryCategoriesMock.mockResolvedValue([
      { id: "income-1", wallet_id: "wallet-1", name: "Gaji", kind: "income", color: "green", is_system: true },
      { id: "expense-1", wallet_id: "wallet-1", name: "Hobi", kind: "expense", color: "blue", is_system: false }
    ]);
    queryTransactionsMock.mockResolvedValue([
      {
        id: "tx-income-current",
        wallet_id: "wallet-1",
        category_id: "income-1",
        kind: "income",
        amount: 5000000,
        note: "Gaji bulanan",
        happened_at: "2026-06-10T08:00:00.000Z"
      },
      {
        id: "tx-income-prev",
        wallet_id: "wallet-1",
        category_id: "income-1",
        kind: "income",
        amount: 4800000,
        note: "Gaji bulan lalu",
        happened_at: "2026-05-10T08:00:00.000Z"
      },
      {
        id: "tx-expense-current",
        wallet_id: "wallet-1",
        category_id: "expense-1",
        kind: "expense",
        amount: 250000,
        note: "Board game",
        happened_at: "2026-06-12T08:00:00.000Z"
      }
    ]);
    queryBudgetsMock.mockResolvedValue([
      { id: "budget-1", wallet_id: "wallet-1", category_id: "expense-1", month_start: "2026-06-01", amount: 300000 }
    ]);
  });

  it("matches income categories and leaves budget null", async () => {
    const result = await getCategoryFocusForUser("user-1", "month", "berapa total Gaji saya?", "wallet-1");

    expect(result).toMatchObject({
      categoryId: "income-1",
      categoryName: "Gaji",
      categoryKind: "income",
      totalAmount: 5000000,
      transactionCount: 1,
      walletNames: ["Dompet Utama"],
      budget: null,
      previousPeriod: {
        totalAmount: 4800000,
        transactionCount: 1,
        deltaAmount: 200000,
        deltaPercent: 4
      }
    });
  });

  it("matches expense categories outside any recap top-five heuristic", async () => {
    const result = await getCategoryFocusForUser("user-1", "month", "breakdown Hobi bulan ini", "wallet-1");

    expect(result).toMatchObject({
      categoryId: "expense-1",
      categoryName: "Hobi",
      categoryKind: "expense",
      totalAmount: 250000,
      budget: {
        amount: 300000,
        spent: 250000,
        remaining: 50000,
        usagePercent: 83,
        status: "warning"
      }
    });
  });
});
