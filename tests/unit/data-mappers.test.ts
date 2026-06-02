import { describe, expect, it } from "vitest";
import {
  buildMonthlyReport,
  buildRecurringTransactionListItems,
  buildWalletSummaries,
  createRecurringTransactionsPageData,
  createBudgetsPageData,
  createDashboardData,
  createSavingsPageData,
  createTransactionsPageData
} from "../../lib/data/mappers";
import type {
  BudgetRow,
  CategoryRow,
  RecurringTransactionRow,
  SavingEntryRow,
  SavingRow,
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
  { id: "c1", wallet_id: "w1", name: "Makan", kind: "expense", color: "#123456", is_system: false },
  { id: "c2", wallet_id: "w1", name: "Gaji", kind: "income", color: "#654321", is_system: false },
  { id: "c3", wallet_id: "w1", name: "Sewa", kind: "expense", color: "#abcdef", is_system: false },
  { id: "c4", wallet_id: "w2", name: "Transport", kind: "expense", color: "#fedcba", is_system: false },
  { id: "c5", wallet_id: "w1", name: "Tabungan", kind: "expense", color: "#5d7a74", is_system: true },
  { id: "c6", wallet_id: "w1", name: "Pencairan Tabungan", kind: "income", color: "#7a9d8f", is_system: true },
  { id: "c7", wallet_id: "w2", name: "Tabungan", kind: "expense", color: "#5d7a74", is_system: true },
  { id: "c8", wallet_id: "w1", name: "Penyesuaian Saldo Masuk", kind: "income", color: "#6f8f78", is_system: true },
  { id: "c9", wallet_id: "w1", name: "Penyesuaian Saldo Keluar", kind: "expense", color: "#8e7558", is_system: true }
];

const budgets: BudgetRow[] = [
  { id: "b1", wallet_id: "w1", category_id: "c1", month_start: "2026-05-01", amount: 500000 },
  { id: "b2", wallet_id: "w1", category_id: "c3", month_start: "2026-05-01", amount: 1000000 }
];

const transactions: TransactionRow[] = [
  { id: "t1", wallet_id: "w1", category_id: "c1", kind: "expense", amount: 200000, happened_at: "2026-05-10", note: "Belanja mingguan", split_type: null, recurring_transaction_id: "r1", recurring_scheduled_for: "2026-05-10T00:00:00.000Z", saving_entry_id: null, source: "manual" },
  { id: "t2", wallet_id: "w1", category_id: "c2", kind: "income", amount: 2000000, happened_at: "2026-05-01", note: null, split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" },
  { id: "t3", wallet_id: "w1", category_id: "c3", kind: "expense", amount: 800000, happened_at: "2026-05-02", note: "Bayar kontrakan", split_type: "equal", recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" },
  { id: "t4", wallet_id: "w1", category_id: "c1", kind: "expense", amount: 100000, happened_at: "2026-04-15", note: null, split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" },
  { id: "t5", wallet_id: "w2", category_id: "c4", kind: "expense", amount: 150000, happened_at: "2026-05-11", note: "Ojek", split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "manual" },
  { id: "t6", wallet_id: "w1", category_id: "c5", kind: "expense", amount: 300000, happened_at: "2026-05-03", note: "Setor awal", split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: "se1", source: "saving_adjustment" },
  { id: "t7", wallet_id: "w1", category_id: "c6", kind: "income", amount: 50000, happened_at: "2026-05-20", note: "Kebutuhan mendadak", split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: "se2", source: "saving_adjustment" },
  { id: "t8", wallet_id: "w1", category_id: "c5", kind: "expense", amount: 50000, happened_at: "2026-05-21", note: "Top up liburan", split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: "se3", source: "saving_adjustment" },
  { id: "t9", wallet_id: "w2", category_id: "c7", kind: "expense", amount: 50000, happened_at: "2026-05-15", note: "Persiapan servis", split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: "se4", source: "saving_adjustment" },
  { id: "t10", wallet_id: "w1", category_id: "c8", kind: "income", amount: 100000, happened_at: "2026-05-12", note: null, split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "balance_adjustment" },
  { id: "t11", wallet_id: "w1", category_id: "c9", kind: "expense", amount: 40000, happened_at: "2026-04-20", note: null, split_type: null, recurring_transaction_id: null, recurring_scheduled_for: null, saving_entry_id: null, source: "balance_adjustment" }
];

const recurringTransactions: RecurringTransactionRow[] = [
  {
    id: "r1",
    wallet_id: "w1",
    category_id: "c1",
    kind: "expense",
    amount: 200000,
    note: "Belanja mingguan",
    frequency: "weekly",
    interval_count: 1,
    start_date: "2026-05-01",
    end_date: null,
    next_run_at: "2026-06-05T00:00:00.000Z",
    status: "active",
    last_generated_at: "2026-05-29T00:00:00.000Z"
  }
];

const savings: SavingRow[] = [
  { id: "s1", wallet_id: "w1", name: "Dana darurat", target_amount: 500000, current_balance: 250000, is_archived: false },
  { id: "s2", wallet_id: "w1", name: "Liburan", target_amount: null, current_balance: 50000, is_archived: false },
  { id: "s3", wallet_id: "w2", name: "Servis motor", target_amount: 200000, current_balance: 50000, is_archived: false }
];

const savingEntries: SavingEntryRow[] = [
  { id: "se1", saving_id: "s1", wallet_id: "w1", entry_type: "deposit", amount: 300000, happened_at: "2026-05-03T00:00:00.000Z", note: "Setor awal", member_user_id: "u1" },
  { id: "se2", saving_id: "s1", wallet_id: "w1", entry_type: "withdraw", amount: 50000, happened_at: "2026-05-20T00:00:00.000Z", note: "Kebutuhan mendadak", member_user_id: null },
  { id: "se3", saving_id: "s2", wallet_id: "w1", entry_type: "deposit", amount: 50000, happened_at: "2026-05-21T00:00:00.000Z", note: "Top up liburan", member_user_id: "u2" },
  { id: "se4", saving_id: "s3", wallet_id: "w2", entry_type: "deposit", amount: 50000, happened_at: "2026-05-15T00:00:00.000Z", note: "Persiapan servis", member_user_id: null }
];

const splits: TransactionSplitRow[] = [{ wallet_id: "w1", owed_amount: 300000, paid_amount: 100000 }];

describe("data mappers", () => {
  it("builds wallet summaries with current month spend and balances", () => {
    const summaries = buildWalletSummaries({
      memberships,
      wallets,
      memberRows,
      transactions,
      savings,
      savingEntries,
      budgets,
      month: "2026-05"
    });

    expect(summaries).toHaveLength(2);
    expect(summaries[1]).toMatchObject({
      id: "w1",
      availableBalance: 660000,
      savingBalance: 300000,
      totalBalance: 960000,
      spentThisMonth: 1350000,
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
      savings,
      savingEntries,
      categories,
      splits,
      month: "2026-05"
    });

    expect(dashboard.totalBalance).toBe(810000);
    expect(dashboard.totalAvailableBalance).toBe(460000);
    expect(dashboard.totalSavingBalance).toBe(350000);
    expect(dashboard.totalExpenseThisMonth).toBe(1550000);
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

    expect(pageData.transactions).toHaveLength(7);
    expect(pageData.transactions.find((transaction) => transaction.id === "t2")).toMatchObject({
      title: "Pemasukan",
      categoryName: "Gaji"
    });
    expect(pageData.transactions.find((transaction) => transaction.id === "t1")?.isRecurring).toBe(true);
    expect(pageData.transactions.find((transaction) => transaction.id === "t6")).toMatchObject({
      isSavingLinked: true,
      categoryName: "Tabungan"
    });
    expect(pageData.transactions.find((transaction) => transaction.id === "t10")).toMatchObject({
      title: "Penyesuaian saldo masuk",
      isBalanceAdjustment: true,
      categoryName: "Penyesuaian Saldo Masuk"
    });
    expect(pageData.categories.some((category) => category.id === "c8" || category.id === "c9")).toBe(false);
    expect(pageData.currentUserRole).toBe("owner");
  });

  it("creates savings page data with shared contributions that stay historical", () => {
    const pageData = createSavingsPageData({
      shell,
      wallet: wallets[0],
      memberships,
      memberRows: memberRows.filter((member) => member.wallet_id === "w1"),
      profileMap: new Map([
        ["u1", { full_name: "Ilham", email: "ilham@example.com" }],
        ["u2", { full_name: "Alya", email: "alya@example.com" }]
      ]),
      savings: savings.filter((saving) => saving.wallet_id === "w1"),
      savingEntries: savingEntries.filter((entry) => entry.wallet_id === "w1"),
      walletSummary: buildWalletSummaries({
        memberships,
        wallets: [wallets[0]],
        memberRows: memberRows.filter((member) => member.wallet_id === "w1"),
        transactions: transactions.filter((transaction) => transaction.wallet_id === "w1"),
        savings: savings.filter((saving) => saving.wallet_id === "w1"),
        savingEntries: savingEntries.filter((entry) => entry.wallet_id === "w1"),
        budgets,
        month: "2026-05"
      })[0]
    });

    expect(pageData.walletSummary.availableBalance).toBe(660000);
    expect(pageData.savings[0].entries[0].type).toBe("withdraw");
    expect(pageData.savings[0].contributions).toEqual([
      { memberUserId: "u1", memberName: "Ilham", totalContributed: 300000 }
    ]);
    expect(pageData.savings[1].contributions).toEqual([
      { memberUserId: "u2", memberName: "Alya", totalContributed: 50000 }
    ]);
  });

  it("builds recurring transaction list items with labels", () => {
    const items = buildRecurringTransactionListItems(recurringTransactions, categories.filter((category) => category.wallet_id === "w1"));

    expect(items[0]).toMatchObject({
      id: "r1",
      categoryName: "Makan",
      frequencyLabel: "Mingguan",
      status: "active"
    });
  });

  it("creates recurring page data for a wallet", () => {
    const pageData = createRecurringTransactionsPageData({
      shell,
      wallet: wallets[0],
      memberships,
      categories: categories.filter((category) => category.wallet_id === "w1"),
      recurringTransactions
    });

    expect(pageData.currentUserRole).toBe("owner");
    expect(pageData.recurringTransactions).toHaveLength(1);
    expect(pageData.recurringTransactions[0].nextRunLabel).toBeTruthy();
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
    expect(pageData.categories.some((category) => category.id === "c9")).toBe(false);
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
      { month: "2026-04", label: "Apr", income: 0, expense: 140000 },
      { month: "2026-05", label: "Mei", income: 2150000, expense: 1550000 }
    ]);
  });
});
