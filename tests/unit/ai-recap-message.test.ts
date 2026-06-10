import { describe, expect, it } from "vitest";
import { buildDirectRecapMessage } from "@/lib/ai/recap-message";
import type { AiFinancialRecap } from "@/lib/ai/data";

function createRecap(overrides: Partial<AiFinancialRecap> = {}): AiFinancialRecap {
  return {
    period: "week",
    range: {
      start: "2026-06-09T00:00:00.000Z",
      end: "2026-06-10T23:59:59.999Z"
    },
    walletId: null,
    walletLabel: "Semua wallet",
    totalIncome: 500000,
    totalExpense: 275000,
    net: 225000,
    transactionCount: 4,
    topExpenseCategories: [{ categoryId: "cat-1", categoryName: "Makan", total: 125000 }],
    perWallet: [
      {
        walletId: "wallet-1",
        walletName: "Personal",
        totalIncome: 500000,
        totalExpense: 275000,
        net: 225000,
        transactionCount: 4
      }
    ],
    ...overrides
  };
}

describe("buildDirectRecapMessage", () => {
  it("builds a readable recap with totals and top category", () => {
    const message = buildDirectRecapMessage(createRecap());

    expect(message).toContain("Rekap minggu ini");
    expect(message).toContain("Semua wallet");
    expect(message).toContain("Pemasukan:");
    expect(message).toContain("Pengeluaran terbesar ada di kategori Makan");
  });

  it("returns an empty-state response when there are no transactions", () => {
    const message = buildDirectRecapMessage(
      createRecap({
        transactionCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        net: 0,
        topExpenseCategories: []
      })
    );

    expect(message).toContain("Belum ada transaksi yang tercatat di periode ini.");
  });
});
