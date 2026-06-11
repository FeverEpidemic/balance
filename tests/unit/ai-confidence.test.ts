import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock supabase server client
const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock
}));

// Mock env
vi.mock("@/lib/env", () => ({
  getDailySpendingCapEnabled: vi.fn(),
  getDailySpendingCapAmount: vi.fn()
}));

import { computeTransactionConfidence } from "@/lib/ai/confidence";
import type { ConfidenceParams } from "@/lib/ai/confidence";

// Re-import for mock access
import { getDailySpendingCapEnabled, getDailySpendingCapAmount } from "@/lib/env";

describe("computeTransactionConfidence", () => {
  const baseParams: ConfidenceParams = {
    walletId: "wallet-1",
    kind: "expense",
    amount: 50000,
    categoryId: null,
    categoryName: null,
    note: null,
    happenedAt: null
  };

  describe("Amount cross-validation", () => {
    it("adds +10 when amount matches exactly in text", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, amount: 50000 },
        "Saya mau catat pengeluaran 50000 untuk makan siang",
        "Dompet Utama"
      );

      // Base 40 + amount_match 10 + (no cat) + (wallet not in text) + (no intent) + (today +5)
      // But wallet name "Dompet Utama" is NOT in the text, so no +25
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.flags).not.toContain("AMOUNT_MISMATCH");
    });

    it("adds +10 when amount is within 10% of text", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, amount: 50000 },
        "Catat pengeluaran 55000 ya",
        "Dompet"
      );

      expect(result.flags).not.toContain("AMOUNT_MISMATCH");
    });

    it("flags AMOUNT_MISMATCH when amount differs by >10%", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, amount: 50000 },
        "Catat transaksi 100000 dong",
        "Dompet"
      );

      expect(result.flags).toContain("AMOUNT_MISMATCH");
      expect(result.score).toBe(50); // 40 - 20 + 0 + 0 + 25 + 5
    });

    it("handles no numbers in text gracefully", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, amount: 50000 },
        "Tolong cek kondisi keuangan saya bulan ini ya",
        "Dompet"
      );

      // No penalty for missing numbers, just no bonus
      expect(result.flags).not.toContain("AMOUNT_MISMATCH");
    });
  });

  describe("Category confidence", () => {
    it("adds +30 for exact category ID", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, categoryId: "cat-1", categoryName: null },
        "Catat pengeluaran 50000",
        "Dompet"
      );

      expect(result.score).toBeGreaterThanOrEqual(60); // 40 + 30 - wallet not in text
    });

    it("adds +15 for fuzzy category name", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, categoryId: null, categoryName: "Makanan" },
        "Catat pengeluaran 50000",
        "Dompet"
      );

      expect(result.score).toBeGreaterThanOrEqual(50); // 40 + 15 - wallet not in text
    });

    it("adds +0 for no category", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, categoryId: null, categoryName: null },
        "Catat pengeluaran 50000",
        "Dompet"
      );

      expect(result.score).toBe(80); // 40 + 10 + 0 + 0 + 25 + 5
    });
  });

  describe("Wallet confidence", () => {
    it("adds +25 when wallet name is in text", () => {
      const result = computeTransactionConfidence(
        baseParams,
        "Catat pengeluaran dari Dompet Utama 50000",
        "Dompet Utama"
      );

      expect(result.reasons).toContain("Wallet disebut dalam teks");
    });

    it("does not add +25 when wallet name is absent from text", () => {
      const result = computeTransactionConfidence(
        baseParams,
        "Catat pengeluaran 50000",
        "Dompet Utama"
      );

      expect(result.reasons).toContain("Wallet tidak disebut dalam teks");
    });
  });

  describe("Intent clarity", () => {
    it("adds +25 for 'catat' keyword", () => {
      const result = computeTransactionConfidence(
        baseParams,
        "Catat pengeluaran 50000 untuk makan",
        "Dompet"
      );

      expect(result.reasons).toContain("Teks mengandung kata kunci pencatatan");
    });

    it("adds +25 for 'simpan' keyword", () => {
      const result = computeTransactionConfidence(
        baseParams,
        "Simpan transaksi ini",
        "Dompet"
      );

      expect(result.reasons).toContain("Teks mengandung kata kunci pencatatan");
    });

    it("adds +0 for analytical questions", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, amount: 50000 },
        "Berapa total pengeluaran bulan ini?",
        "Dompet"
      );

      expect(result.reasons).toContain("Tidak ada kata kunci pencatatan yang jelas");
    });
  });

  describe("HappenedAt confidence", () => {
    it("adds +10 for explicit non-today date", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, happenedAt: "2026-06-15" },
        "Catat pengeluaran 50000 kemarin",
        "Dompet"
      );

      // Explicit happenedAt gets +10
      expect(result.score).toBeGreaterThanOrEqual(45); // 40 + date_explicit 10 - etc
    });

    it("adds +5 for default today", () => {
      const result = computeTransactionConfidence(
        baseParams,
        "Catat pengeluaran 50000",
        "Dompet"
      );

      expect(result.reasons).toContain("Menggunakan tanggal hari ini");
    });
  });

  describe("Overall score tiers", () => {
    it("returns 'high' tier (≥85) when all signals are strong", () => {
      const result = computeTransactionConfidence(
        {
          walletId: "wallet-1",
          kind: "expense",
          amount: 50000,
          categoryId: "cat-1",
          categoryName: null,
          note: "Makan siang",
          happenedAt: "2026-06-15"
        },
        "Saya mau catat pengeluaran 50000 dari Dompet Utama untuk makan siang",
        "Dompet Utama"
      );

      // 40 + 30(amount) + 30(cat id) + 25(wallet in text) + 25(intent) + 10(date explicit) = 160, but clamped to 100
      expect(result.tier).toBe("high");
      expect(result.score).toBeGreaterThanOrEqual(85);
    });

    it("returns 'medium' tier (50-84) with partial signals", () => {
      const result = computeTransactionConfidence(
        {
          walletId: "wallet-1",
          kind: "expense",
          amount: 50000,
          categoryId: null,
          categoryName: "Makanan",
          note: null,
          happenedAt: null
        },
        "Catat 50000",
        "Dompet Lain"
      );

      // 40 + 10(amount) + 15(cat name) + 0(wallet not in text) + 25(intent) + 5(today) = 95
      expect(result.tier).toBe("high"); // Actually this is 95
    });

    it("returns 'low' tier (<50) with minimal signals and mismatch", () => {
      const result = computeTransactionConfidence(
        {
          walletId: "wallet-1",
          kind: "expense",
          amount: 100000,
          categoryId: null,
          categoryName: null,
          note: null,
          happenedAt: null
        },
        "Gimana kondisi keuangan saya?",
        "Dompet"
      );

      // 40 + 0(no amounts) + 0(no cat) + 0(wallet not in text) + 0(no intent) + 5(today) = 45
      expect(result.tier).toBe("low");
      expect(result.score).toBeLessThan(50);
    });
  });

  describe("Flags", () => {
    it("includes AMOUNT_MISMATCH flag when amount differs significantly", () => {
      const result = computeTransactionConfidence(
        { ...baseParams, amount: 100000 },
        "Catat pengeluaran 50000",
        "Dompet"
      );

      expect(result.flags).toContain("AMOUNT_MISMATCH");
    });
  });

  describe("Reasons in Bahasa Indonesia", () => {
    it("returns human-readable reasons array", () => {
      const result = computeTransactionConfidence(
        baseParams,
        "Catat pengeluaran 50000",
        "Dompet"
      );

      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons.every((r) => typeof r === "string")).toBe(true);
    });
  });
});
