export type WalletRole = "owner" | "editor" | "viewer";
export type WalletKind = "personal" | "shared";
export type TransactionKind = "income" | "expense";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type WalletRow = {
  id: string;
  name: string;
  kind: WalletKind;
  owner_user_id: string;
};

export type WalletMemberRow = {
  wallet_id: string;
  user_id: string;
  role: WalletRole;
};

export type CategoryRow = {
  id: string;
  wallet_id: string;
  name: string;
  kind: TransactionKind;
  color: string;
};

export type BudgetRow = {
  id: string;
  wallet_id: string;
  category_id: string;
  month_start: string;
  amount: number;
};

export type TransactionRow = {
  id: string;
  wallet_id: string;
  category_id: string | null;
  kind: TransactionKind;
  amount: number;
  happened_at: string;
  note: string | null;
  split_type: "equal" | "custom" | null;
};

export type InvitationRow = {
  id: string;
  wallet_id: string;
  role: WalletRole;
  token: string;
  status: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
};

export type TransactionSplitRow = {
  wallet_id: string;
  owed_amount: number;
  paid_amount: number;
};

export type TemplateRow = {
  id: string;
  wallet_id: string;
  category_id: string | null;
  kind: TransactionKind;
  name: string;
  default_amount: number | null;
  note: string | null;
};

export type SettlementRow = {
  id: string;
  wallet_id: string;
  payer_user_id: string;
  payee_user_id: string;
  amount: number;
  happened_at: string;
  note: string | null;
};

export type ShellData = {
  userName: string;
  walletCount: number;
  budgetCount: number;
  memberCount: number;
  primaryWalletId: string | null;
};

export type WalletSummary = {
  id: string;
  name: string;
  kind: WalletKind;
  role: WalletRole;
  members: number;
  balance: number;
  spentThisMonth: number;
  budgetThisMonth: number;
};

export type DashboardRecentTransaction = {
  id: string;
  walletId: string;
  walletName: string;
  category: string;
  title: string;
  kind: TransactionKind;
  amount: number;
  date: string;
  splitLabel: string;
};

export type DashboardCategorySpend = {
  name: string;
  value: number;
  color: string;
};

export type DashboardData = {
  shell: ShellData;
  totalBalance: number;
  totalExpenseThisMonth: number;
  outstandingSplit: number;
  wallets: WalletSummary[];
  recentTransactions: DashboardRecentTransaction[];
  categorySpend: DashboardCategorySpend[];
};

export type WalletBundle = {
  shell: ShellData;
  profileMap: Map<string, ProfileRow>;
  categories: CategoryRow[];
  budgets: BudgetRow[];
  members: WalletMemberRow[];
  settlements: SettlementRow[];
  templates: TemplateRow[];
  transactions: TransactionRow[];
  invitations: InvitationRow[];
  wallet: WalletSummary;
};

export type WalletRoleSummary = {
  role: WalletRole;
  count: number;
};

export type WalletOverviewData = {
  shell: ShellData;
  walletId: string;
  walletName: string;
  currentUserRole: WalletRole;
  wallet: WalletSummary;
  hasTransactions: boolean;
  transactionCount: number;
  categoryCount: number;
  activeBudgetCount: number;
  templateCount: number;
  roleSummary: WalletRoleSummary[];
};

export type TransactionListItem = {
  id: string;
  kind: TransactionKind;
  categoryId: string | null;
  categoryName: string;
  amount: number;
  note: string | null;
  happenedAt: string;
  splitType: "equal" | "custom" | null;
  splitLabel: string;
  title: string;
};

export type TransactionsPageData = {
  shell: ShellData;
  walletId: string;
  walletName: string;
  currentUserRole: WalletRole;
  selectedMonth: string;
  categories: CategoryRow[];
  transactions: TransactionListItem[];
};

export type BudgetProgressItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  monthStart: string;
  amount: number;
  used: number;
  ratio: number;
  usageLabel: string;
};

export type BudgetsPageData = {
  shell: ShellData;
  walletId: string;
  walletName: string;
  currentUserRole: WalletRole;
  selectedMonth: string;
  categories: CategoryRow[];
  budgets: BudgetProgressItem[];
};
