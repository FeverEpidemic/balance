import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireUserMock,
  consumeTransactionRateLimitMock,
  invalidateAiInsightCacheMock,
  invalidateWalletReadCachesMock,
  getActionLocaleMock,
  getActionTimezoneMock,
  getActionTranslatorMock,
  getWalletMemberUserIdsMock,
  revalidateWalletPathsMock
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  consumeTransactionRateLimitMock: vi.fn(),
  invalidateAiInsightCacheMock: vi.fn(),
  invalidateWalletReadCachesMock: vi.fn(),
  getActionLocaleMock: vi.fn(),
  getActionTimezoneMock: vi.fn(),
  getActionTranslatorMock: vi.fn(),
  getWalletMemberUserIdsMock: vi.fn(),
  revalidateWalletPathsMock: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  requireUser: requireUserMock
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeTransactionRateLimit: consumeTransactionRateLimitMock
}));

vi.mock("@/lib/data/cache", () => ({
  invalidateAiInsightCache: invalidateAiInsightCacheMock,
  invalidateWalletReadCaches: invalidateWalletReadCachesMock
}));

vi.mock("@/app/actions/_shared", async () => {
  const actual = await vi.importActual<typeof import("@/app/actions/_shared")>("@/app/actions/_shared");

  return {
    ...actual,
    getActionLocale: getActionLocaleMock,
    getActionTimezone: getActionTimezoneMock,
    getActionTranslator: getActionTranslatorMock,
    getWalletMemberUserIds: getWalletMemberUserIdsMock,
    revalidateWalletPaths: revalidateWalletPathsMock
  };
});

import { createBalanceAdjustment } from "@/app/actions/transactions";

function createTranslator() {
  return (key: string) => {
    const messages: Record<string, string> = {
      "actionErrors.balanceAdjustmentCategoryUnavailable": "Kategori penyesuaian saldo tidak dapat disiapkan.",
      "actionErrors.balanceAdjustmentNoChange": "Saldo aktual sama dengan saldo tercatat, jadi tidak ada penyesuaian yang perlu dibuat.",
      "actionErrors.transactionRateLimited": "Terlalu banyak transaksi baru. Coba lagi sebentar.",
      "actionErrors.transactionWriteForbidden": "Kamu tidak punya izin untuk mengubah transaksi di wallet ini.",
      "actionErrors.unexpectedError": "Terjadi kesalahan tak terduga.",
      "actionSuccess.balanceAdjustmentSaved": "Penyesuaian saldo berhasil disimpan."
    };

    return messages[key] ?? key;
  };
}

function createWalletMemberChain(role: "owner" | "editor" | "viewer" = "owner") {
  return {
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role },
          error: null
        })
      }))
    }))
  };
}

function createCategoryLookupChain(result: { data: { id: string; is_system: boolean } | null; error: null }) {
  return {
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue(result)
        }))
      }))
    }))
  };
}

function createCategoryInsertChain(result: { data: { id: string } | null; error: { code?: string; message?: string } | null }) {
  return {
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(result)
    }))
  };
}

function createCategoryUpdateChain() {
  return {
    eq: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  };
}

describe("transaction actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeTransactionRateLimitMock.mockResolvedValue({ allowed: true });
    getActionLocaleMock.mockResolvedValue("id");
    getActionTimezoneMock.mockResolvedValue("Asia/Jakarta");
    getActionTranslatorMock.mockResolvedValue(createTranslator());
    getWalletMemberUserIdsMock.mockResolvedValue(["user-1", "user-2"]);
  });

  it("falls back to the categories table when the balance-adjustment RPC is unavailable", async () => {
    const categoriesInsertMock = vi.fn(() => createCategoryInsertChain({
      data: { id: "cat-adjustment-expense" },
      error: null
    }));
    const transactionsInsertMock = vi.fn().mockResolvedValue({ error: null });
    const categoriesUpdateMock = vi.fn(() => createCategoryUpdateChain());
    const categoriesSelectMock = vi.fn(() => createCategoryLookupChain({
      data: null,
      error: null
    }));
    const rpcMock = vi.fn(async (name: string) => {
      if (name === "get_wallet_balances") {
        return {
          data: [{ available_balance: 100000 }],
          error: null
        };
      }

      if (name === "ensure_balance_adjustment_category") {
        return {
          data: null,
          error: { message: "function public.ensure_balance_adjustment_category not found" }
        };
      }

      return { data: null, error: null };
    });
    const fromMock = vi.fn((table: string) => {
      if (table === "wallet_members") {
        return {
          select: vi.fn(() => createWalletMemberChain("owner"))
        };
      }

      if (table === "categories") {
        return {
          select: categoriesSelectMock,
          insert: categoriesInsertMock,
          update: categoriesUpdateMock
        };
      }

      if (table === "transactions") {
        return {
          insert: transactionsInsertMock
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    requireUserMock.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {
        from: fromMock,
        rpc: rpcMock
      }
    });

    const formData = new FormData();
    formData.set("wallet_id", "wallet-1");
    formData.set("actual_balance", "-50000");
    formData.set("note", "Koreksi kas");
    formData.set("happened_at", "2026-06-16");
    formData.set("happened_at_time", "09:30");

    const result = await createBalanceAdjustment({ status: "idle" }, formData);

    expect(result).toMatchObject({
      status: "success",
      message: "Penyesuaian saldo berhasil disimpan.",
      resetForm: true
    });
    expect(categoriesInsertMock).toHaveBeenCalledWith({
      wallet_id: "wallet-1",
      name: "Penyesuaian Saldo Keluar",
      kind: "expense",
      color: "#8e7558",
      is_system: true,
      created_by: "user-1",
      updated_by: "user-1"
    });
    expect(transactionsInsertMock).toHaveBeenCalledWith(expect.objectContaining({
      wallet_id: "wallet-1",
      category_id: "cat-adjustment-expense",
      kind: "expense",
      amount: 150000,
      note: "Koreksi kas",
      source: "balance_adjustment",
      created_by: "user-1",
      updated_by: "user-1"
    }));
    expect(invalidateWalletReadCachesMock).toHaveBeenCalledWith("wallet-1", expect.any(Object));
    expect(revalidateWalletPathsMock).toHaveBeenCalledWith("wallet-1", expect.any(Object));
  });

  it("reuses an existing fallback category and upgrades it to a system category", async () => {
    const categoriesInsertMock = vi.fn(() => createCategoryInsertChain({
      data: { id: "unused" },
      error: null
    }));
    const categoriesUpdateMock = vi.fn(() => createCategoryUpdateChain());
    const categoriesSelectMock = vi.fn(() => createCategoryLookupChain({
      data: { id: "cat-adjustment-income", is_system: false },
      error: null
    }));
    const transactionsInsertMock = vi.fn().mockResolvedValue({ error: null });
    const rpcMock = vi.fn(async (name: string) => {
      if (name === "get_wallet_balances") {
        return {
          data: [{ available_balance: 100000 }],
          error: null
        };
      }

      if (name === "ensure_balance_adjustment_category") {
        return {
          data: null,
          error: { message: "cached RPC signature mismatch" }
        };
      }

      return { data: null, error: null };
    });
    const fromMock = vi.fn((table: string) => {
      if (table === "wallet_members") {
        return {
          select: vi.fn(() => createWalletMemberChain("owner"))
        };
      }

      if (table === "categories") {
        return {
          select: categoriesSelectMock,
          insert: categoriesInsertMock,
          update: categoriesUpdateMock
        };
      }

      if (table === "transactions") {
        return {
          insert: transactionsInsertMock
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    requireUserMock.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {
        from: fromMock,
        rpc: rpcMock
      }
    });

    const formData = new FormData();
    formData.set("wallet_id", "wallet-1");
    formData.set("actual_balance", "130000");
    formData.set("note", "Koreksi kas masuk");
    formData.set("happened_at", "2026-06-16");
    formData.set("happened_at_time", "10:15");

    const result = await createBalanceAdjustment({ status: "idle" }, formData);

    expect(result).toMatchObject({
      status: "success",
      message: "Penyesuaian saldo berhasil disimpan."
    });
    expect(categoriesInsertMock).not.toHaveBeenCalled();
    expect(categoriesUpdateMock).toHaveBeenCalledWith({
      is_system: true,
      color: "#6f8f78",
      updated_by: "user-1"
    });
    expect(transactionsInsertMock).toHaveBeenCalledWith(expect.objectContaining({
      wallet_id: "wallet-1",
      category_id: "cat-adjustment-income",
      kind: "income",
      amount: 30000,
      note: "Koreksi kas masuk",
      source: "balance_adjustment"
    }));
  });
});
