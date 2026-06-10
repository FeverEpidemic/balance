import { describe, expect, it } from "vitest";
import { buildFallbackFinanceAnswer, isLowSignalAiReply } from "@/lib/ai/fallback-response";
import type { AiFinancialRecap } from "@/lib/ai/data";

function createRecap(overrides: Partial<AiFinancialRecap> = {}): AiFinancialRecap {
  return {
    period: "month",
    range: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-06-10T23:59:59.999Z"
    },
    walletId: null,
    walletLabel: "Semua wallet",
    totalIncome: 1200000,
    totalExpense: 800000,
    net: 400000,
    transactionCount: 6,
    topExpenseCategories: [{ categoryId: "cat-1", categoryName: "Cicilan", total: 500000 }],
    perWallet: [
      {
        walletId: "wallet-1",
        walletName: "Personal",
        totalIncome: 1200000,
        totalExpense: 800000,
        net: 400000,
        transactionCount: 6
      }
    ],
    ...overrides
  };
}

describe("isLowSignalAiReply", () => {
  it("marks generic closure replies as low-signal", () => {
    expect(isLowSignalAiReply("Sama-sama! Kalau ada yang mau ditanya lebih detail, bilang aja ya 😊")).toBe(true);
  });

  it("keeps substantive answers out of low-signal mode", () => {
    expect(isLowSignalAiReply("Pengeluaran terbesar kamu ada di cicilan Rp500.000 dan net bulan ini masih positif Rp400.000.")).toBe(false);
  });
});

describe("buildFallbackFinanceAnswer", () => {
  it("builds a savings-focused answer for hemat prompts", () => {
    const message = buildFallbackFinanceAnswer("Area mana yang paling realistis untuk dihemat?", createRecap());

    expect(message).toContain("Area hemat yang paling realistis");
    expect(message).toContain("Cicilan");
  });

  it("builds an analysis-focused answer for analysis prompts", () => {
    const message = buildFallbackFinanceAnswer("Analisis pengeluaran saya", createRecap());

    expect(message).toContain("total pengeluaran");
    expect(message).toContain("Cicilan");
  });

  it("uses category focus when the prompt mentions a specific category", () => {
    const message = buildFallbackFinanceAnswer("Breakdown cicilan saya", createRecap(), {
      categoryId: "cat-1",
      categoryName: "Cicilan",
      totalExpense: 500000,
      transactionCount: 2,
      walletNames: ["Personal"],
      recentNotes: ["KPR rumah", "Cicilan motor"],
      budget: {
        month: "2026-06",
        amount: 600000,
        spent: 500000,
        remaining: 100000,
        usagePercent: 83,
        status: "warning"
      },
      previousPeriod: {
        range: {
          start: "2026-05-01T00:00:00.000Z",
          end: "2026-05-10T23:59:59.999Z"
        },
        totalExpense: 350000,
        transactionCount: 1,
        deltaAmount: 150000,
        deltaPercent: 43
      }
    });

    expect(message).toContain("Untuk kategori Cicilan sendiri, tercatat 2 transaksi");
    expect(message).toContain("KPR rumah");
    expect(message).toContain("sudah mendekati batas");
    expect(message).toContain("Dibanding periode sebelumnya, pengeluaran kategori ini naik");
  });
});
