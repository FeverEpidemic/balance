import { describe, expect, it } from "vitest";
import { buildAiSystemPrompt, buildCompactFinancialContext } from "@/lib/ai/prompts";
import type { AiFinancialRecap } from "@/lib/ai/data";
import { estimateTokenCount } from "@/lib/ai/token-budget";

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

describe("buildAiSystemPrompt compact mode", () => {
  it("collapses perWallet into a single summary line", () => {
    const prompt = buildAiSystemPrompt({
      recap: createRecap({
        perWallet: [
          { walletId: "w1", walletName: "Dompet A", totalIncome: 1000000, totalExpense: 500000, net: 500000, transactionCount: 5 },
          { walletId: "w2", walletName: "Dompet B", totalIncome: 2000000, totalExpense: 300000, net: 1700000, transactionCount: 3 },
          { walletId: "w3", walletName: "Dompet C", totalIncome: 0, totalExpense: 200000, net: -200000, transactionCount: 2 }
        ]
      }),
      wallets: [
        { id: "w1", name: "Dompet A", kind: "personal" },
        { id: "w2", name: "Dompet B", kind: "personal" },
        { id: "w3", name: "Dompet C", kind: "personal" }
      ],
      period: "day",
      latestUserMessage: "Analisis pengeluaran",
      categoryFocus: null,
      compact: true
    });

    // Should have single summary line with wallet count
    expect(prompt).toContain("3 wallet aktif");
    // Should NOT have per-wallet breakdown lines
    expect(prompt).not.toContain("Dompet A: pemasukan");
    expect(prompt).not.toContain("Dompet B: pemasukan");
  });

  it("limits topExpenseCategories to 3 in compact month mode", () => {
    const categories = [
      { categoryId: "c1", categoryName: "Makan", total: 500000 },
      { categoryId: "c2", categoryName: "Transport", total: 300000 },
      { categoryId: "c3", categoryName: "Hiburan", total: 200000 },
      { categoryId: "c4", categoryName: "Belanja", total: 150000 },
      { categoryId: "c5", categoryName: "Kesehatan", total: 100000 }
    ];

    const promptCompact = buildAiSystemPrompt({
      recap: createRecap({ topExpenseCategories: categories }),
      wallets: [{ id: "w1", name: "Dompet", kind: "personal" }],
      period: "month",
      latestUserMessage: "Rekap",
      categoryFocus: null,
      compact: true
    });

    const promptFull = buildAiSystemPrompt({
      recap: createRecap({ topExpenseCategories: categories }),
      wallets: [{ id: "w1", name: "Dompet", kind: "personal" }],
      period: "month",
      latestUserMessage: "Rekap",
      categoryFocus: null
    });

    expect(promptCompact).toContain("Makan");
    expect(promptCompact).toContain("Transport");
    expect(promptCompact).toContain("Hiburan");
    expect(promptCompact).not.toContain("Belanja");
    // Full mode should have all 5
    expect(promptFull).toContain("Belanja");
  });

  it("omits previousPeriod comparison when period is day in compact mode", () => {
    const categoryFocus = {
      categoryId: "c1",
      categoryName: "Makan",
      categoryKind: "expense" as const,
      totalAmount: 50000,
      transactionCount: 2,
      walletNames: ["Dompet"],
      recentNotes: ["Makan siang"],
      budget: null,
      previousPeriod: {
        range: { start: "2026-06-09T00:00:00.000Z", end: "2026-06-09T23:59:59.999Z" },
        totalAmount: 45000,
        transactionCount: 1,
        deltaAmount: 5000,
        deltaPercent: 11
      }
    };

    const prompt = buildAiSystemPrompt({
      recap: createRecap(),
      wallets: [{ id: "w1", name: "Dompet", kind: "personal" }],
      period: "day",
      latestUserMessage: "Berapa makan hari ini?",
      categoryFocus,
      compact: true
    });

    expect(prompt).not.toContain("Perbandingan dengan periode sebelumnya");
  });

  it("omits recentNotes in minimal period tier", () => {
    const categoryFocus = {
      categoryId: "c1",
      categoryName: "Makan",
      categoryKind: "expense" as const,
      totalAmount: 50000,
      transactionCount: 2,
      walletNames: ["Dompet A", "Dompet B", "Dompet C"],
      recentNotes: ["Makan siang", "Kopi"],
      budget: null,
      previousPeriod: null
    };

    const prompt = buildAiSystemPrompt({
      recap: createRecap(),
      wallets: [
        { id: "w1", name: "Dompet A", kind: "personal" },
        { id: "w2", name: "Dompet B", kind: "personal" },
        { id: "w3", name: "Dompet C", kind: "personal" }
      ],
      period: "day",
      latestUserMessage: "Analisis",
      categoryFocus,
      compact: true
    });

    expect(prompt).not.toContain("Catatan transaksi terbaru");
  });

  it("uses shorter prompts for day than week or month", () => {
    const input = {
      recap: createRecap({
        topExpenseCategories: [
          { categoryId: "c1", categoryName: "Makan", total: 500000 },
          { categoryId: "c2", categoryName: "Transport", total: 300000 },
          { categoryId: "c3", categoryName: "Belanja", total: 200000 }
        ],
        perWallet: [
          { walletId: "w1", walletName: "Dompet A", totalIncome: 1000000, totalExpense: 500000, net: 500000, transactionCount: 5 },
          { walletId: "w2", walletName: "Dompet B", totalIncome: 800000, totalExpense: 300000, net: 500000, transactionCount: 4 },
          { walletId: "w3", walletName: "Dompet C", totalIncome: 700000, totalExpense: 200000, net: 500000, transactionCount: 3 }
        ]
      }),
      wallets: [
        { id: "w1", name: "Dompet A", kind: "personal" as const },
        { id: "w2", name: "Dompet B", kind: "personal" as const },
        { id: "w3", name: "Dompet C", kind: "shared" as const }
      ],
      latestUserMessage: "Analisis pengeluaran saya",
      categoryFocus: null
    };

    const dayPrompt = buildAiSystemPrompt({ ...input, period: "day" });
    const weekPrompt = buildAiSystemPrompt({ ...input, period: "week" });
    const monthPrompt = buildAiSystemPrompt({ ...input, period: "month" });

    expect(estimateTokenCount(dayPrompt)).toBeLessThan(estimateTokenCount(weekPrompt));
    expect(estimateTokenCount(weekPrompt)).toBeLessThan(estimateTokenCount(monthPrompt));
    expect(dayPrompt).not.toContain("Dompet A: pemasukan");
    expect(weekPrompt).toContain("Dompet A: pemasukan");
    expect(monthPrompt).toContain("Dompet C: pemasukan");
  });

  it("describes income category focus without expense wording", () => {
    const prompt = buildAiSystemPrompt({
      recap: createRecap(),
      wallets: [{ id: "w1", name: "Dompet", kind: "personal" }],
      period: "month",
      latestUserMessage: "Gaji bulan ini berapa?",
      categoryFocus: {
        categoryId: "income-1",
        categoryName: "Gaji",
        categoryKind: "income",
        totalAmount: 5000000,
        transactionCount: 1,
        walletNames: ["Dompet"],
        recentNotes: ["Gaji bulanan"],
        budget: null,
        previousPeriod: {
          range: { start: "2026-05-01T00:00:00.000Z", end: "2026-05-31T23:59:59.999Z" },
          totalAmount: 4800000,
          transactionCount: 1,
          deltaAmount: 200000,
          deltaPercent: 4
        }
      }
    });

    expect(prompt).toContain("Jenis kategori ini: pemasukan");
    expect(prompt).toContain("Tidak berlaku untuk kategori pemasukan");
    expect(prompt).toContain("Total pemasukan kategori ini di periode aktif");
  });
});

describe("buildCompactFinancialContext", () => {
  it("returns a one-paragraph financial summary", () => {
    const recap = createRecap();
    const context = buildCompactFinancialContext({ recap, period: "month" });
    expect(context).toContain("Rekap month");
    expect(context).toContain("pemasukan");
    expect(context).toContain("pengeluaran");
    expect(context).toContain("net");
    expect(context.length).toBeLessThan(300); // Should be compact
  });
});
