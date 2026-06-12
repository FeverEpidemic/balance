import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildReportPdfData } from "../../lib/pdf/build-report-data";
import type { WalletBundle } from "../../lib/data";

const bundle: WalletBundle = {
  shell: {
    userName: "Ilham",
    walletCount: 1,
    budgetCount: 1,
    memberCount: 2,
    primaryWalletId: "w1"
  },
  profileMap: new Map(),
  categories: [
    { id: "c1", wallet_id: "w1", name: "Makan", kind: "expense", color: "#90a46b", is_system: false },
    { id: "c2", wallet_id: "w1", name: "Gaji", kind: "income", color: "#5d7a74", is_system: false },
    { id: "c3", wallet_id: "w1", name: "Transport", kind: "expense", color: "#6f8f78", is_system: false }
  ],
  budgets: [],
  members: [],
  recurringTransactions: [],
  savings: [],
  savingEntries: [],
  settlements: [],
  templates: [],
  invitations: [],
  transactions: [
    { id: "t1", wallet_id: "w1", category_id: "c2", kind: "income", amount: 5000000, happened_at: "2026-05-01T00:00:00.000Z", note: null, split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" },
    { id: "t2", wallet_id: "w1", category_id: "c1", kind: "expense", amount: 750000, happened_at: "2026-05-03T00:00:00.000Z", note: "Belanja", split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" },
    { id: "t3", wallet_id: "w1", category_id: "c3", kind: "expense", amount: 250000, happened_at: "2026-05-05T00:00:00.000Z", note: "Ojek", split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" },
    { id: "t4", wallet_id: "w1", category_id: "c2", kind: "income", amount: 4500000, happened_at: "2026-04-01T00:00:00.000Z", note: null, split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" },
    { id: "t5", wallet_id: "w1", category_id: "c1", kind: "expense", amount: 500000, happened_at: "2026-04-02T00:00:00.000Z", note: null, split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" }
  ],
  wallet: {
    id: "w1",
    name: "Rumah Utama",
    kind: "shared",
    role: "owner",
    members: 2,
    availableBalance: 8000000,
    savingBalance: 0,
    totalBalance: 8000000,
    spentThisMonth: 1000000,
    budgetThisMonth: 0,
    currency: "IDR"
  }
};

describe("report pdf builder", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-09T09:30:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("builds summary and latest month category breakdown", () => {
    const report = buildReportPdfData(bundle, "id");

    expect(report.walletName).toBe("Rumah Utama");
    expect(report.period.monthKey).toBe("2026-05");
    expect(report.summary).toEqual({
      income: 5000000,
      expense: 1000000,
      net: 4000000
    });
    expect(report.monthlyRows).toHaveLength(2);
    expect(report.categoryRows[0]).toMatchObject({
      name: "Makan",
      amount: 750000
    });
    expect(report.categoryRows[0].share).toBeCloseTo(0.75);
    expect(report.categoryRows[1]).toMatchObject({
      name: "Transport",
      amount: 250000
    });
  });
});
