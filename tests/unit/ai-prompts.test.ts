import { describe, expect, it } from "vitest";
import { buildAiSystemPrompt } from "@/lib/ai/prompts";
import type { AiFinancialRecap } from "@/lib/ai/data";

function createRecap(overrides: Partial<AiFinancialRecap> = {}): AiFinancialRecap {
  return {
    period: "month",
    range: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-06-30T23:59:59.999Z"
    },
    walletId: null,
    walletLabel: "Semua wallet",
    totalIncome: 5000000,
    totalExpense: 1800000,
    net: 3200000,
    transactionCount: 12,
    topExpenseCategories: [{ categoryId: "cat-1", categoryName: "Makan", total: 450000 }],
    perWallet: [
      {
        walletId: "wallet-1",
        walletName: "Dompet Utama",
        totalIncome: 5000000,
        totalExpense: 1800000,
        net: 3200000,
        transactionCount: 12
      }
    ],
    ...overrides
  };
}

describe("buildAiSystemPrompt", () => {
  it("includes guidance for transaction recording tools", () => {
    const prompt = buildAiSystemPrompt({
      recap: createRecap(),
      wallets: [{ id: "wallet-1", name: "Dompet Utama", kind: "personal" }],
      period: "month",
      latestUserMessage: "Tolong bantu catat pengeluaran makan saya",
      categoryFocus: null
    });

    expect(prompt).toContain("getCategories");
    expect(prompt).toContain("createTransaction");
    expect(prompt).toContain("Jika user belum menyebut wallet");
    expect(prompt).toContain("Setelah createTransaction berhasil");
  });
});
