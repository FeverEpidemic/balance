import { describe, expect, it } from "vitest";
import {
  buildDailyExpenses,
  buildMonthlyReport,
  buildRecurringTransactionListItems,
  buildTransactionListItems,
  buildWalletSummaries,
  createTransactionHistoryPageData,
  createRecurringTransactionsPageData,
  createBudgetsPageData,
  createCategoriesPageData,
  createDashboardData,
  createSavingsPageData,
  filterAndPaginateTransactionHistory,
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
  { id: "w1", name: "Rumah Utama", kind: "shared", owner_user_id: "u1", currency: "IDR" },
  { id: "w2", name: "Dompet Pribadi", kind: "personal", owner_user_id: "u1", currency: "IDR" }
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
  { id: "b1", wallet_id: "w1", category_id: "c1", month_start: "2026-05-01", amount: 500000, carry_over_enabled: false },
  { id: "b2", wallet_id: "w1", category_id: "c3", month_start: "2026-05-01", amount: 1000000, carry_over_enabled: false }
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
    const mayTransactions = transactions.filter((t) => t.happened_at.startsWith("2026-05"));
    const dashboard = createDashboardData({
      shell,
      memberships,
      wallets,
      memberRows,
      budgets,
      recentTransactions: transactions.slice(0, 3),
      monthTransactions: mayTransactions,
      balancesByWallet: new Map([["w1", 660000], ["w2", -200000]]),
      savings,
      savingEntries,
      categories,
      splits,
      month: "2026-05"
    });

    expect(dashboard.totalBalance).toBe(810000);
    expect(dashboard.totalAvailableBalance).toBe(460000);
    expect(dashboard.totalAvailableBudget).toBe(150000);
    expect(dashboard.totalSavingBalance).toBe(350000);
    expect(dashboard.totalExpenseThisMonth).toBe(1550000);
    expect(dashboard.totalIncomeThisMonth).toBe(2150000);
    expect(dashboard.outstandingSplit).toBe(200000);
    expect(dashboard.wallets).toHaveLength(2);
    expect(dashboard.createTransactionContext).toMatchObject({
      walletId: "w1",
      walletName: "Rumah Utama",
      walletCurrency: "IDR"
    });
    expect(dashboard.createTransactionContext?.categories.map((category) => category.id)).toEqual(["c1", "c2", "c3", "c5", "c6"]);
    expect(dashboard.recentTransactions[2]).toMatchObject({
      category: "Sewa",
      categoryColor: "#abcdef",
      splitLabel: "Split rata"
    });
    expect(dashboard.categorySpend[0]).toMatchObject({
      name: "Sewa",
      value: 800000
    });
    expect(dashboard.dailyExpenses).toHaveLength(31);
    expect(dashboard.dailyExpenses[0]).toMatchObject({
      day: 1,
      dayLabel: "1",
      date: "2026-05-01",
      amount: 0,
      isToday: false
    });
    expect(dashboard.dailyExpenses[1]).toMatchObject({
      day: 2,
      dayLabel: "2",
      date: "2026-05-02",
      amount: 800000,
      isToday: false
    });
    expect(dashboard.dailyExpenses[2]).toMatchObject({
      day: 3,
      dayLabel: "3",
      date: "2026-05-03",
      amount: 300000,
      isToday: false
    });
    expect(dashboard.dailyExpenses[9]).toMatchObject({
      day: 10,
      dayLabel: "10",
      date: "2026-05-10",
      amount: 200000,
      isToday: false
    });
    expect(dashboard.dailyExpenses[19]).toMatchObject({
      day: 20,
      dayLabel: "20",
      date: "2026-05-20",
      amount: 0,
      isToday: false
    });
    expect(dashboard.dailyExpenses[20]).toMatchObject({
      day: 21,
      dayLabel: "21",
      date: "2026-05-21",
      amount: 50000,
      isToday: false
    });
    expect(dashboard.onboarding.isVisible).toBe(true);
    expect(dashboard.onboarding.state).toBe("completed");
  });

  it("builds a full-month daily expense series with zero-filled dates", () => {
    const dailyExpenses = buildDailyExpenses(
      [
        transactions[0],
        transactions[2],
        transactions[4],
        transactions[5],
        transactions[8],
        { ...transactions[0], id: "t1b", amount: 50000, happened_at: "2026-05-10" },
        { ...transactions[1], id: "t2b", amount: 700000, happened_at: "2026-05-10" }
      ],
      "2026-05"
    );

    expect(dailyExpenses).toHaveLength(31);
    expect(dailyExpenses[0]).toMatchObject({ date: "2026-05-01", amount: 0 });
    expect(dailyExpenses[1]).toMatchObject({ date: "2026-05-02", amount: 800000 });
    expect(dailyExpenses[8]).toMatchObject({ date: "2026-05-09", amount: 0 });
    expect(dailyExpenses[9]).toMatchObject({ date: "2026-05-10", amount: 250000 });
    expect(dailyExpenses[14]).toMatchObject({ date: "2026-05-15", amount: 50000 });
    expect(dailyExpenses[30]).toMatchObject({ date: "2026-05-31", amount: 0 });
  });

  it("shows onboarding for a new user without a wallet", () => {
    const dashboard = createDashboardData({
      shell: {
        ...shell,
        walletCount: 0,
        budgetCount: 0,
        memberCount: 0,
        primaryWalletId: null,
        onboardingState: "active"
      },
      memberships: [],
      wallets: [],
      memberRows: [],
      budgets: [],
      recentTransactions: [],
      monthTransactions: [],
      savings: [],
      savingEntries: [],
      categories: [],
      splits: [],
      month: "2026-05"
    });

    expect(dashboard.onboarding).toMatchObject({
      isVisible: true,
      state: "active",
      completedSteps: 0,
      totalSteps: 4
    });
    expect(dashboard.onboarding.steps[0]).toMatchObject({
      id: "create_wallet",
      isComplete: false,
      href: "/dashboard"
    });
    expect(dashboard.createTransactionContext).toBeNull();
  });

  it("marks only the wallet step complete when the user has a wallet but no manual transactions", () => {
    const dashboard = createDashboardData({
      shell: {
        ...shell,
        walletCount: 1,
        budgetCount: 0,
        memberCount: 1,
        primaryWalletId: "w1",
        onboardingState: "active"
      },
      memberships: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      wallets: [wallets[0]],
      memberRows: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      budgets: [],
      recentTransactions: [],
      monthTransactions: transactions.filter((transaction) => transaction.source !== "manual"),
      savings: [],
      savingEntries: [],
      categories: categories
        .filter((category) => category.wallet_id === "w1")
        .map((category) => ({ ...category, is_system: true })),
      splits: [],
      month: "2026-05"
    });

    expect(dashboard.onboarding).toMatchObject({
      isVisible: true,
      state: "active",
      completedSteps: 2,
      totalSteps: 4
    });
    expect(dashboard.onboarding.steps[0]?.isComplete).toBe(true);
    expect(dashboard.onboarding.steps[1]?.isComplete).toBe(false);
    expect(dashboard.onboarding.steps[2]?.isComplete).toBe(true);
    expect(dashboard.onboarding.steps[3]?.isComplete).toBe(false);
  });

  it("omits dashboard transaction context when the primary wallet is read-only", () => {
    const dashboard = createDashboardData({
      shell: {
        ...shell,
        primaryWalletId: "w1"
      },
      memberships: [{ wallet_id: "w1", user_id: "u1", role: "viewer" }],
      wallets: [wallets[0]],
      memberRows: [{ wallet_id: "w1", user_id: "u1", role: "viewer" }],
      budgets: [],
      recentTransactions: [],
      monthTransactions: [],
      savings: [],
      savingEntries: [],
      categories: categories.filter((category) => category.wallet_id === "w1"),
      splits: [],
      month: "2026-05"
    });

    expect(dashboard.createTransactionContext).toBeNull();
  });

  it("omits dashboard transaction context when the primary wallet cannot be resolved", () => {
    const dashboard = createDashboardData({
      shell: {
        ...shell,
        primaryWalletId: "missing-wallet"
      },
      memberships,
      wallets,
      memberRows,
      budgets,
      recentTransactions: [],
      monthTransactions: [],
      savings: [],
      savingEntries: [],
      categories,
      splits: [],
      month: "2026-05"
    });

    expect(dashboard.createTransactionContext).toBeNull();
  });

  it("completes the organize step when the wallet has a custom category or any budget", () => {
    const customCategoryDashboard = createDashboardData({
      shell: {
        ...shell,
        walletCount: 1,
        budgetCount: 0,
        memberCount: 1,
        primaryWalletId: "w1",
        onboardingState: "active"
      },
      memberships: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      wallets: [wallets[0]],
      memberRows: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      budgets: [],
      recentTransactions: [],
      monthTransactions: [transactions[0]],
      savings: [],
      savingEntries: [],
      categories: categories.filter((category) => category.wallet_id === "w1"),
      splits: [],
      month: "2026-05"
    });

    expect(customCategoryDashboard.onboarding.steps[2]).toMatchObject({
      id: "organize_wallet",
      isComplete: true,
      href: "/wallets/w1/budgets"
    });

    const budgetOnlyDashboard = createDashboardData({
      shell: {
        ...shell,
        walletCount: 1,
        budgetCount: 1,
        memberCount: 1,
        primaryWalletId: "w1",
        onboardingState: "active"
      },
      memberships: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      wallets: [wallets[0]],
      memberRows: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      budgets: [budgets[0]],
      recentTransactions: [],
      monthTransactions: [transactions[0]],
      savings: [],
      savingEntries: [],
      categories: categories
        .filter((category) => category.wallet_id === "w1")
        .map((category) => ({ ...category, is_system: true })),
      splits: [],
      month: "2026-05"
    });

    expect(budgetOnlyDashboard.onboarding.steps[2]).toMatchObject({
      id: "organize_wallet",
      isComplete: true,
      href: "/wallets/w1/budgets"
    });
  });

  it("completes the savings step when any wallet has a saving record", () => {
    const dashboard = createDashboardData({
      shell: {
        ...shell,
        walletCount: 1,
        budgetCount: 0,
        memberCount: 1,
        primaryWalletId: "w1",
        onboardingState: "active"
      },
      memberships: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      wallets: [wallets[0]],
      memberRows: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      budgets: [],
      recentTransactions: [],
      monthTransactions: [],
      savings: [savings[0]],
      savingEntries: [],
      categories: categories.filter((category) => category.wallet_id === "w1"),
      splits: [],
      month: "2026-05"
    });

    expect(dashboard.onboarding.steps[3]).toMatchObject({
      id: "start_saving",
      isComplete: true,
      href: "/wallets/w1/savings"
    });
  });

  it("reaches the completed state when all four onboarding steps are done", () => {
    const dashboard = createDashboardData({
      shell: {
        ...shell,
        walletCount: 1,
        budgetCount: 1,
        memberCount: 1,
        primaryWalletId: "w1",
        onboardingState: "active"
      },
      memberships: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      wallets: [wallets[0]],
      memberRows: [{ wallet_id: "w1", user_id: "u1", role: "owner" }],
      budgets: [budgets[0]],
      recentTransactions: [],
      monthTransactions: [transactions[0]],
      savings: [savings[0]],
      savingEntries: [],
      categories: categories.filter((category) => category.wallet_id === "w1"),
      splits: [],
      month: "2026-05"
    });

    expect(dashboard.onboarding).toMatchObject({
      isVisible: true,
      state: "completed",
      completedSteps: 4,
      totalSteps: 4
    });
    expect(dashboard.onboarding.steps.map((step) => step.id)).toEqual([
      "create_wallet",
      "add_transaction",
      "organize_wallet",
      "start_saving"
    ]);
    expect(dashboard.onboarding.steps.every((step) => step.isComplete)).toBe(true);
  });

  it("hides onboarding when the profile has already dismissed it", () => {
    const dashboard = createDashboardData({
      shell: {
        ...shell,
        onboardingState: "dismissed",
        onboardingDismissedAt: "2026-06-06T10:00:00.000Z"
      },
      memberships,
      wallets,
      memberRows,
      budgets,
      recentTransactions: transactions.slice(0, 3),
      monthTransactions: transactions,
      savings,
      savingEntries,
      categories,
      splits,
      month: "2026-05"
    });

    expect(dashboard.onboarding).toMatchObject({
      isVisible: false,
      state: "dismissed"
    });
  });

  it("hides onboarding when the profile has already completed it", () => {
    const dashboard = createDashboardData({
      shell: {
        ...shell,
        onboardingState: "completed",
        onboardingCompletedAt: "2026-06-06T10:00:00.000Z"
      },
      memberships,
      wallets,
      memberRows,
      budgets,
      recentTransactions: transactions.slice(0, 3),
      monthTransactions: transactions,
      savings,
      savingEntries,
      categories,
      splits,
      month: "2026-05"
    });

    expect(dashboard.onboarding).toMatchObject({
      isVisible: false,
      state: "completed"
    });
  });

  it("creates filtered transactions page data", () => {
    const pageData = createTransactionsPageData({
      shell: shell,
      wallet: wallets[0],
      memberships,
      categories: categories.filter((category) => category.wallet_id === "w1"),
      transactions,
      selectedMonth: "2026-05"
    });

    expect(pageData.transactions).toHaveLength(7);
    expect(pageData.transactions.find((transaction) => transaction.id === "t2")).toMatchObject({
      title: "Pemasukan",
      categoryName: "Gaji",
      categoryColor: "#654321"
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

  it("filters, sorts, and paginates transaction history server-side", () => {
    const historyItems = buildTransactionListItems(
      transactions.filter((transaction) => transaction.wallet_id === "w1" && transaction.happened_at.startsWith("2026-05")),
      categories.filter((category) => category.wallet_id === "w1")
    );

    const byCategory = filterAndPaginateTransactionHistory({
      transactions: historyItems,
      searchQuery: "tabungan",
      sortBy: "category",
      sortDirection: "asc",
      page: 1,
      pageSize: 10
    });

    expect(byCategory.totalCount).toBe(3);
    expect(byCategory.transactions.map((transaction) => transaction.id)).toEqual(["t7", "t8", "t6"]);

    const byKind = filterAndPaginateTransactionHistory({
      transactions: historyItems,
      sortBy: "kind",
      sortDirection: "asc",
      page: 1,
      pageSize: 3
    });

    expect(byKind.transactions.map((transaction) => transaction.kind)).toEqual(["income", "income", "income"]);
    expect(byKind.totalPages).toBe(3);
    expect(byKind.hasNextPage).toBe(true);

    const secondPage = filterAndPaginateTransactionHistory({
      transactions: historyItems,
      sortBy: "amount",
      sortDirection: "desc",
      page: 2,
      pageSize: 2
    });

    expect(secondPage.currentPage).toBe(2);
    expect(secondPage.hasPreviousPage).toBe(true);
    expect(secondPage.transactions.map((transaction) => transaction.amount)).toEqual([300000, 200000]);
  });

  it("creates transaction history page data with active search and sort state", () => {
    const pageData = createTransactionHistoryPageData({
      shell,
      wallet: wallets[0],
      memberships,
      categories: categories.filter((category) => category.wallet_id === "w1"),
      transactions: transactions.filter((transaction) => transaction.wallet_id === "w1" && transaction.happened_at.startsWith("2026-05")),
      selectedMonth: "2026-05",
      searchQuery: "gaji",
      sortBy: "kind",
      sortDirection: "asc",
      page: 1,
      pageSize: 5
    });

    expect(pageData.searchQuery).toBe("gaji");
    expect(pageData.sortBy).toBe("kind");
    expect(pageData.sortDirection).toBe("asc");
    expect(pageData.totalCount).toBe(1);
    expect(pageData.transactions[0]).toMatchObject({
      id: "t2",
      categoryName: "Gaji",
      kind: "income"
    });
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
      allBudgets: budgets,
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

  it("creates categories page data for the active wallet only", () => {
    const pageData = createCategoriesPageData({
      shell,
      wallet: wallets[0],
      memberships,
      categories
    });

    expect(pageData.currentUserRole).toBe("owner");
    expect(pageData.categories.every((category) => category.wallet_id === "w1")).toBe(true);
    expect(pageData.categories.some((category) => category.id === "c4")).toBe(false);
  });

  it("builds monthly report buckets for the latest months", () => {
    const report = buildMonthlyReport(transactions);

    expect(report).toEqual([
      { month: "2026-04", label: "Apr", income: 0, expense: 140000 },
      { month: "2026-05", label: "Mei", income: 2150000, expense: 1550000 }
    ]);
  });

  it("respects maxMonths=3, returning at most 3 entries", () => {
    const report = buildMonthlyReport(transactions, "id", 3);

    // Only 2 months exist in test data; both should be returned
    expect(report).toHaveLength(2);
    expect(report[0].month).toBe("2026-04");
    expect(report[1].month).toBe("2026-05");
  });

  it("respects maxMonths=1, returning only the most recent month", () => {
    const report = buildMonthlyReport(transactions, "id", 1);

    expect(report).toHaveLength(1);
    expect(report[0].month).toBe("2026-05");
  });

  it("defaults to 6-month window when no maxMonths is provided", () => {
    const report = buildMonthlyReport(transactions);

    expect(report).toHaveLength(2); // test data has only 2 months
  });

  it("orders results oldest-to-newest within the visible range", () => {
    const report = buildMonthlyReport(transactions, "id", 3);

    expect(report[0].month).toBe("2026-04");
    expect(report[1].month).toBe("2026-05");
  });
});
