import { describe, expect, it } from "vitest";
import type { AiCategoryFocus, AiFinancialRecap } from "@/lib/ai/data";
import { buildFallbackFinanceAnswer } from "@/lib/ai/fallback-response";

const recap: AiFinancialRecap = {
  period: "month",
  range: {
    start: "2026-06-01T00:00:00.000Z",
    end: "2026-06-30T23:59:59.999Z"
  },
  walletId: null,
  walletLabel: "Semua wallet",
  totalIncome: 6000000,
  totalExpense: 1000000,
  net: 5000000,
  transactionCount: 8,
  topExpenseCategories: [{ categoryId: "expense-1", categoryName: "Makan", total: 300000 }],
  perWallet: [
    {
      walletId: "wallet-1",
      walletName: "Dompet Utama",
      totalIncome: 6000000,
      totalExpense: 1000000,
      net: 5000000,
      transactionCount: 8
    }
  ]
};

describe("category focus income behavior", () => {
  it("keeps budget null for income focus payloads", () => {
    const incomeFocus: AiCategoryFocus = {
      categoryId: "income-1",
      categoryName: "Bonus",
      categoryKind: "income",
      totalAmount: 1000000,
      transactionCount: 1,
      walletNames: ["Dompet Utama"],
      recentNotes: ["Bonus proyek"],
      budget: null,
      previousPeriod: null
    };

    const message = buildFallbackFinanceAnswer("breakdown bonus saya", recap, incomeFocus);
    expect(message).toContain("transaksi pemasukan");
  });
});
