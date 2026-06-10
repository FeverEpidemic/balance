import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createTransactionViaAiMock,
  getBudgetStatusForUserMock,
  getCategoriesForWalletsMock,
  getFinancialRecapForUserMock,
  getRecentTransactionsForUserMock
} = vi.hoisted(() => ({
  createTransactionViaAiMock: vi.fn(),
  getBudgetStatusForUserMock: vi.fn(),
  getCategoriesForWalletsMock: vi.fn(),
  getFinancialRecapForUserMock: vi.fn(),
  getRecentTransactionsForUserMock: vi.fn()
}));

vi.mock("@/lib/ai/data", () => ({
  createTransactionViaAi: createTransactionViaAiMock,
  getBudgetStatusForUser: getBudgetStatusForUserMock,
  getCategoriesForWallets: getCategoriesForWalletsMock,
  getFinancialRecapForUser: getFinancialRecapForUserMock,
  getRecentTransactionsForUser: getRecentTransactionsForUserMock
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
});
