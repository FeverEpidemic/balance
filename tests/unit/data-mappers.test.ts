import { describe, expect, it } from "vitest";
import {
  buildMonthlyReport,
  buildWalletSummaries,
  createBudgetsPageData,
  createDashboardData,
  createTransactionsPageData
} from "../../lib/data/mappers";
import type {
  BudgetRow,
  CategoryRow,
  ShellData,
  TransactionRow,
  TransactionSplitRow,
  WalletMemberRow,
  WalletRow
} from "../../lib/data/types";

const shell: ShellData = {
  userName: "Ilham",
  walletCount: 2,
  budgetCount: 2,
  memberCount: 3,
  primaryWalletId: "w1"
};

const memberships: WalletMemberRow[] = [
  { wallet_id: "w1", user_id: "u1", role: "owner" },
  { wallet_id: "w2", user_id: "u1", role: "editor" }
];

const wallets: WalletRow[] = [
  { id: "w1", name: "Rumah Utama", kind: "shared", owner_user_id: "u1" },
  { id: "w2", name: "Dompet Pribadi", kind: "personal", owner_user_id: "u1" }
];

const memberRows: WalletMemberRow[] = [
  { wallet_id: "w1", user_id: "u1", role: "owner" },
  { wallet_id: "w1", user_id: "u2", role: "viewer" },
  { wallet_id: "w2", user_id: "u1", role: "editor" }
];

const categories: CategoryRow[] = [
  { id: "c1", wallet_id: "w1", name: "Makan", kind: "expense", color: "#123456" },
  { id: "c2", wallet_id: "w1", name: "Gaji", kind: "income", color: "#654321" },
  { id: "c3", wallet_id: "w1", name: "Sewa", kind: "expense", color: "#abcdef" },
  { id: "c4", wallet_id: "w2", name: "Transport", kind: "expense", color: "#fedcba" }
];

const budgets: BudgetRow[] = [
  { id: "b1", wallet_id: "w1", category_id: "c1", month_start: "2026-05-01", amount: 500000 },
  { id: "b2", wallet_id: "w1", category_id: "c3", month_start: "2026-05-01", amount: 1000000 }
];

const transactions: TransactionRow[] = [
  { id: "t1", wallet_id: "w1", category_id: "c1", kind: "expense", amount: 200000, happened_at: "2026-05-10", note: "Belanja mingguan", split_type: null },
  { id: "t2", wallet_id: "w1", category_id: "c2", kind: "income", amount: 2000000, happened_at: "2026-05-01", note: null, split_type: null },
  { id: "t3", wallet_id: "w1", category_id: "c3", kind: "expense", amount: 800000, happened_at: "2026-05-02", note: "Bayar kontrakan", split_type: "equal" },
  { id: "t4", wallet_id: "w1", category_id: "c1", kind: "expense", amount: 100000, happened_at: "2026-04-15", note: null, split_type: null },
  { id: "t5", wallet_id: "w2", category_id: "c4", kind: "expense", amount: 150000, happened_at: "2026-05-11", note: "Ojek", split_type: null }
];

const splits: TransactionSplitRow[] = [{ wallet_id: "w1", owed_amount: 300000, paid_amount: 100000 }];

describe("data mappers", () => {
  it("builds wallet summaries with current month spend and balances", () => {
    const summaries = buildWalletSummaries({
      memberships,
      wallets,
      memberRows,
      transactions,
      budgets,
      month: "2026-05"
    });

    expect(summaries).toHaveLength(2);
    expect(summaries[1]).toMatchObject({
      id: "w1",
      balance: 900000,
      spentThisMonth: 1000000,
      budgetThisMonth: 1500000,
      members: 2,
      role: "owner"
    });
  });

  it("creates dashboard data from fixture inputs", () => {
    const dashboard = createDashboardData({
      shell,
      memberships,
      wallets,
      memberRows,
      budgets,
      recentTransactions: transactions.slice(0, 3),
      allTransactions: transactions,
      categories,
      splits,
      month: "2026-05"
    });

    expect(dashboard.totalBalance).toBe(750000);
    expect(dashboard.totalExpenseThisMonth).toBe(1150000);
    expect(dashboard.outstandingSplit).toBe(200000);
    expect(dashboard.wallets).toHaveLength(2);
    expect(dashboard.recentTransactions[2]).toMatchObject({
      category: "Sewa",
      splitLabel: "Split rata"
    });
    expect(dashboard.categorySpend[0]).toMatchObject({
      name: "Sewa",
      value: 800000
    });
  });

  it("creates filtered transactions page data", () => {
    const pageData = createTransactionsPageData({
      shell,
      wallet: wallets[0],
      memberships,
      categories: categories.filter((category) => category.wallet_id === "w1"),
      transactions,
      selectedMonth: "2026-05"
    });

    expect(pageData.transactions).toHaveLength(3);
    expect(pageData.transactions[1]).toMatchObject({
      title: "Pemasukan",
      categoryName: "Gaji"
    });
    expect(pageData.currentUserRole).toBe("owner");
  });

  it("creates budget progress rows with usage labels", () => {
    const pageData = createBudgetsPageData({
      shell,
      wallet: wallets[0],
      memberships,
      categories: categories.filter((category) => category.wallet_id === "w1"),
      budgets,
      transactions,
      selectedMonth: "2026-05"
    });

    expect(pageData.budgets).toHaveLength(2);
    expect(pageData.budgets[0]).toMatchObject({
      categoryName: "Makan",
      used: 200000,
      ratio: 40
    });
    expect(pageData.budgets[1].usageLabel).toContain("80%");
  });

  it("builds monthly report buckets for the latest months", () => {
    const report = buildMonthlyReport(transactions);

    expect(report).toEqual([
      { month: "2026-04", label: "Apr", income: 0, expense: 100000 },
      { month: "2026-05", label: "Mei", income: 2000000, expense: 1150000 }
    ]);
  });
});
