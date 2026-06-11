import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createTransactionViaAiMock,
  getBudgetStatusForUserMock,
  getCategoriesForWalletsMock,
  getFinancialRecapForUserMock,
  getRecentTransactionsForUserMock,
  checkDuplicateTransactionMock,
  checkDailySpendingCapMock,
  resolveWalletNameMock,
  computeTransactionConfidenceMock
} = vi.hoisted(() => ({
  createTransactionViaAiMock: vi.fn(),
  getBudgetStatusForUserMock: vi.fn(),
  getCategoriesForWalletsMock: vi.fn(),
  getFinancialRecapForUserMock: vi.fn(),
  getRecentTransactionsForUserMock: vi.fn(),
  checkDuplicateTransactionMock: vi.fn(),
  checkDailySpendingCapMock: vi.fn(),
  resolveWalletNameMock: vi.fn(),
  computeTransactionConfidenceMock: vi.fn()
}));

vi.mock("@/lib/ai/data", () => ({
  createTransactionViaAi: createTransactionViaAiMock,
  getBudgetStatusForUser: getBudgetStatusForUserMock,
  getCategoriesForWallets: getCategoriesForWalletsMock,
  getFinancialRecapForUser: getFinancialRecapForUserMock,
  getRecentTransactionsForUser: getRecentTransactionsForUserMock
}));

vi.mock("@/lib/ai/confidence", () => ({
  checkDuplicateTransaction: checkDuplicateTransactionMock,
  checkDailySpendingCap: checkDailySpendingCapMock,
  resolveWalletName: resolveWalletNameMock,
  computeTransactionConfidence: computeTransactionConfidenceMock
}));

import { aiTools, executeAiToolCall } from "@/lib/ai/tools";

describe("aiTools", () => {
  it("registers category lookup and create transaction tools", () => {
    const toolNames = aiTools
      .filter((tool): tool is (typeof aiTools)[number] & { type: "function"; function: { name: string } } => tool.type === "function")
      .map((tool) => tool.function.name);

    expect(toolNames).toContain("getCategories");
    expect(toolNames).toContain("createTransaction");
  });
});

describe("executeAiToolCall", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks for confidence checks — allow transactions by default
    resolveWalletNameMock.mockResolvedValue("Dompet Utama");
    checkDuplicateTransactionMock.mockResolvedValue({ isDuplicate: false });
    checkDailySpendingCapMock.mockResolvedValue({ exceeded: false, todayTotal: 0, threshold: 0 });
    computeTransactionConfidenceMock.mockReturnValue({
      score: 95,
      tier: "high",
      flags: [],
      reasons: ["Yakin"]
    });
  });

  it("routes getCategories to the data layer", async () => {
    getCategoriesForWalletsMock.mockResolvedValue([{ id: "cat-1", name: "Makan" }]);

    const result = await executeAiToolCall("user-1", {
      id: "call-1",
      type: "function",
      function: {
        name: "getCategories",
        arguments: JSON.stringify({ walletId: "wallet-1" })
      }
    });

    expect(getCategoriesForWalletsMock).toHaveBeenCalledWith("user-1", ["wallet-1"]);
    expect(JSON.parse(result)).toEqual([{ id: "cat-1", name: "Makan" }]);
  });

  it("routes createTransaction to the data layer with parsed arguments", async () => {
    createTransactionViaAiMock.mockResolvedValue({
      ok: true,
      message: "Transaksi berhasil disimpan."
    });

    const result = await executeAiToolCall("user-1", {
      id: "call-2",
      type: "function",
      function: {
        name: "createTransaction",
        arguments: JSON.stringify({
          walletId: "wallet-1",
          kind: "expense",
          amount: 15000,
          categoryId: "cat-1",
          note: "Makan siang",
          happenedAt: "2026-06-10"
        })
      }
    });

    expect(createTransactionViaAiMock).toHaveBeenCalledWith("user-1", {
      walletId: "wallet-1",
      kind: "expense",
      amount: 15000,
      categoryId: "cat-1",
      categoryName: null,
      note: "Makan siang",
      happenedAt: "2026-06-10"
    });
    expect(JSON.parse(result)).toEqual({
      ok: true,
      message: "Transaksi berhasil disimpan."
    });
  });

  it("returns a structured error payload when a tool throws", async () => {
    getCategoriesForWalletsMock.mockRejectedValue(new Error("WALLET_ACCESS_DENIED"));

    const result = await executeAiToolCall("user-1", {
      id: "call-3",
      type: "function",
      function: {
        name: "getCategories",
        arguments: JSON.stringify({ walletId: "wallet-x" })
      }
    });

    expect(JSON.parse(result)).toEqual({
      error: "WALLET_ACCESS_DENIED",
      tool: "getCategories"
    });
  });

  describe("createTransaction pre-validation", () => {
    it("rejects empty walletId", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-4",
        type: "function",
        function: {
          name: "createTransaction",
          arguments: JSON.stringify({
            walletId: "",
            kind: "expense",
            amount: 15000
          })
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details).toEqual(
        expect.arrayContaining([expect.stringContaining("walletId")])
      );
    });

    it("rejects invalid kind", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-5",
        type: "function",
        function: {
          name: "createTransaction",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            kind: "transfer",
            amount: 50000
          })
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details).toEqual(
        expect.arrayContaining([expect.stringContaining("kind")])
      );
    });

    it("rejects amount <= 0", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-6",
        type: "function",
        function: {
          name: "createTransaction",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            kind: "expense",
            amount: 0
          })
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details).toEqual(
        expect.arrayContaining([expect.stringContaining("amount")])
      );
    });

    it("rejects negative amount", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-7",
        type: "function",
        function: {
          name: "createTransaction",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            kind: "expense",
            amount: -5000
          })
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details).toEqual(
        expect.arrayContaining([expect.stringContaining("amount")])
      );
    });

    it("reports multiple validation errors at once", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-8",
        type: "function",
        function: {
          name: "createTransaction",
          arguments: JSON.stringify({
            walletId: "   ",
            kind: "invalid",
            amount: "not-a-number"
          })
        }
      });

      const parsed = JSON.parse(result);

      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details.length).toBeGreaterThanOrEqual(3);
    });

    it("passes valid params through to createTransactionViaAi", async () => {
      createTransactionViaAiMock.mockResolvedValue({
        ok: true,
        message: "Transaksi berhasil disimpan."
      });

      const result = await executeAiToolCall("user-1", {
        id: "call-9",
        type: "function",
        function: {
          name: "createTransaction",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            kind: "income",
            amount: 250000,
            categoryId: "cat-1",
            note: "Gaji",
            happenedAt: "2026-06-15"
          })
        }
      });

      expect(createTransactionViaAiMock).toHaveBeenCalledWith("user-1", {
        walletId: "wallet-1",
        kind: "income",
        amount: 250000,
        categoryId: "cat-1",
        categoryName: null,
        note: "Gaji",
        happenedAt: "2026-06-15"
      });
      expect(JSON.parse(result)).toEqual({
        ok: true,
        message: "Transaksi berhasil disimpan."
      });
    });
  });
});
