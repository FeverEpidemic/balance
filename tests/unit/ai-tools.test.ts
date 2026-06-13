import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createTransactionViaAiMock,
  getBudgetStatusForUserMock,
  getCategoriesForWalletsMock,
  getFinancialRecapForUserMock,
  getRecentTransactionsForUserMock,
  resolveWalletIdByNameMock,
  checkDuplicateTransactionMock,
  checkDailySpendingCapMock,
  resolveWalletNameMock,
  computeTransactionConfidenceMock,
  createBudgetViaAiMock,
  updateBudgetViaAiMock,
  deleteBudgetViaAiMock
} = vi.hoisted(() => ({
  createTransactionViaAiMock: vi.fn(),
  getBudgetStatusForUserMock: vi.fn(),
  getCategoriesForWalletsMock: vi.fn(),
  getFinancialRecapForUserMock: vi.fn(),
  getRecentTransactionsForUserMock: vi.fn(),
  resolveWalletIdByNameMock: vi.fn((_userId: string, walletId: string) => Promise.resolve(walletId)),
  checkDuplicateTransactionMock: vi.fn(),
  checkDailySpendingCapMock: vi.fn(),
  resolveWalletNameMock: vi.fn(),
  computeTransactionConfidenceMock: vi.fn(),
  createBudgetViaAiMock: vi.fn(),
  updateBudgetViaAiMock: vi.fn(),
  deleteBudgetViaAiMock: vi.fn()
}));

vi.mock("@/lib/ai/data", () => ({
  createTransactionViaAi: createTransactionViaAiMock,
  getBudgetStatusForUser: getBudgetStatusForUserMock,
  getCategoriesForWallets: getCategoriesForWalletsMock,
  getFinancialRecapForUser: getFinancialRecapForUserMock,
  getRecentTransactionsForUser: getRecentTransactionsForUserMock,
  resolveWalletIdByName: resolveWalletIdByNameMock,
  createBudgetViaAi: createBudgetViaAiMock,
  updateBudgetViaAi: updateBudgetViaAiMock,
  deleteBudgetViaAi: deleteBudgetViaAiMock
}));

vi.mock("@/lib/ai/confidence", () => ({
  checkDuplicateTransaction: checkDuplicateTransactionMock,
  checkDailySpendingCap: checkDailySpendingCapMock,
  resolveWalletName: resolveWalletNameMock,
  computeTransactionConfidence: computeTransactionConfidenceMock
}));

import { aiTools, executeAiToolCall } from "@/lib/ai/tools";

describe("aiTools", () => {
  it("registers all tools", () => {
    const toolNames = aiTools
      .filter((tool): tool is (typeof aiTools)[number] & { type: "function"; function: { name: string } } => tool.type === "function")
      .map((tool) => tool.function.name);

    expect(toolNames).toContain("getCategories");
    expect(toolNames).toContain("createTransaction");
    expect(toolNames).toContain("createBudget");
    expect(toolNames).toContain("updateBudget");
    expect(toolNames).toContain("deleteBudget");
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

  it("routes getTransactions with date filters and preserves totalMatched", async () => {
    getRecentTransactionsForUserMock.mockResolvedValue({
      totalMatched: 6,
      startDate: "2026-06-12",
      endDate: "2026-06-12",
      items: [
        {
          id: "tx-1",
          walletId: "wallet-1",
          walletName: "Dompet Utama",
          amount: 15000,
          kind: "expense",
          happenedAt: "2026-06-12T10:00:00.000Z",
          note: "Kopi",
          categoryName: "Makan"
        }
      ]
    });

    const result = await executeAiToolCall("user-1", {
      id: "call-tx-1",
      type: "function",
      function: {
        name: "getTransactions",
        arguments: JSON.stringify({
          walletId: "wallet-1",
          startDate: "2026-06-12",
          endDate: "2026-06-12",
          limit: 20
        })
      }
    });

    expect(getRecentTransactionsForUserMock).toHaveBeenCalledWith("user-1", "wallet-1", {
      limit: 20,
      startDate: "2026-06-12",
      endDate: "2026-06-12"
    });
    expect(JSON.parse(result)).toEqual({
      totalMatched: 6,
      startDate: "2026-06-12",
      endDate: "2026-06-12",
      items: [
        {
          walletName: "Dompet Utama",
          amount: 15000,
          kind: "expense",
          happenedAt: "2026-06-12T10:00:00.000Z",
          note: "Kopi",
          categoryName: "Makan"
        }
      ]
    });
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

  describe("budget tools", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("routes createBudget to the data layer with valid params", async () => {
      createBudgetViaAiMock.mockResolvedValue({
        ok: true,
        message: "Anggaran berhasil dibuat.",
        budget: { id: "budget-1", walletId: "wallet-1", categoryId: "cat-1", amount: 500000 }
      });

      const result = await executeAiToolCall("user-1", {
        id: "call-budget-1",
        type: "function",
        function: {
          name: "createBudget",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            categoryId: "cat-1",
            monthStart: "2026-07",
            amount: 500000
          })
        }
      });

      expect(createBudgetViaAiMock).toHaveBeenCalledWith("user-1", {
        walletId: "wallet-1",
        categoryId: "cat-1",
        monthStart: "2026-07",
        amount: 500000
      });
      expect(JSON.parse(result)).toEqual({
        ok: true,
        message: "Anggaran berhasil dibuat.",
        budget: { id: "budget-1", walletId: "wallet-1", categoryId: "cat-1", amount: 500000 }
      });
    });

    it("rejects createBudget with empty walletId", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-budget-2",
        type: "function",
        function: {
          name: "createBudget",
          arguments: JSON.stringify({
            walletId: "",
            categoryId: "cat-1",
            monthStart: "2026-07",
            amount: 500000
          })
        }
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details).toEqual(
        expect.arrayContaining([expect.stringContaining("walletId")])
      );
    });

    it("rejects createBudget with empty categoryId", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-budget-3",
        type: "function",
        function: {
          name: "createBudget",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            categoryId: "",
            monthStart: "2026-07",
            amount: 500000
          })
        }
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details).toEqual(
        expect.arrayContaining([expect.stringContaining("categoryId")])
      );
    });

    it("rejects createBudget with amount <= 0", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-budget-4",
        type: "function",
        function: {
          name: "createBudget",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            categoryId: "cat-1",
            monthStart: "2026-07",
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

    it("uses current month when monthStart is not provided for createBudget", async () => {
      createBudgetViaAiMock.mockResolvedValue({
        ok: true,
        message: "Anggaran berhasil dibuat."
      });

      await executeAiToolCall("user-1", {
        id: "call-budget-5",
        type: "function",
        function: {
          name: "createBudget",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            categoryId: "cat-1",
            monthStart: "",
            amount: 300000
          })
        }
      });

      const callArgs = createBudgetViaAiMock.mock.calls[0][1];
      expect(callArgs.walletId).toBe("wallet-1");
      expect(callArgs.categoryId).toBe("cat-1");
      expect(callArgs.monthStart).toMatch(/^\d{4}-\d{2}$/);
      expect(callArgs.amount).toBe(300000);
    });

    it("routes updateBudget to the data layer with valid params", async () => {
      updateBudgetViaAiMock.mockResolvedValue({
        ok: true,
        message: "Anggaran berhasil diperbarui.",
        budget: { id: "budget-1", walletId: "wallet-1", amount: 750000 }
      });

      const result = await executeAiToolCall("user-1", {
        id: "call-budget-6",
        type: "function",
        function: {
          name: "updateBudget",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            budgetId: "budget-1",
            amount: 750000
          })
        }
      });

      expect(updateBudgetViaAiMock).toHaveBeenCalledWith("user-1", {
        walletId: "wallet-1",
        budgetId: "budget-1",
        amount: 750000
      });
      expect(JSON.parse(result)).toEqual({
        ok: true,
        message: "Anggaran berhasil diperbarui.",
        budget: { id: "budget-1", walletId: "wallet-1", amount: 750000 }
      });
    });

    it("rejects updateBudget with empty budgetId", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-budget-7",
        type: "function",
        function: {
          name: "updateBudget",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            budgetId: "",
            amount: 500000
          })
        }
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details).toEqual(
        expect.arrayContaining([expect.stringContaining("budgetId")])
      );
    });

    it("routes deleteBudget to the data layer with valid params", async () => {
      deleteBudgetViaAiMock.mockResolvedValue({
        ok: true,
        message: "Anggaran berhasil dihapus."
      });

      const result = await executeAiToolCall("user-1", {
        id: "call-budget-8",
        type: "function",
        function: {
          name: "deleteBudget",
          arguments: JSON.stringify({
            walletId: "wallet-1",
            budgetId: "budget-1"
          })
        }
      });

      expect(deleteBudgetViaAiMock).toHaveBeenCalledWith("user-1", {
        walletId: "wallet-1",
        budgetId: "budget-1"
      });
      expect(JSON.parse(result)).toEqual({
        ok: true,
        message: "Anggaran berhasil dihapus."
      });
    });

    it("rejects deleteBudget with empty walletId", async () => {
      const result = await executeAiToolCall("user-1", {
        id: "call-budget-9",
        type: "function",
        function: {
          name: "deleteBudget",
          arguments: JSON.stringify({
            walletId: "",
            budgetId: "budget-1"
          })
        }
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe("VALIDATION_FAILED");
      expect(parsed.details).toEqual(
        expect.arrayContaining([expect.stringContaining("walletId")])
      );
    });
  });
});
