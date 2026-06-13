import type { AppLocale } from "@/lib/i18n";

export type WalletRole = "owner" | "editor" | "viewer";
export type WalletKind = "personal" | "shared";
export type TransactionKind = "income" | "expense";
export type TransactionSource = "manual" | "saving_adjustment" | "balance_adjustment";
export type TransactionHistorySortField = "happened_at" | "amount" | "category" | "kind";
export type SortDirection = "asc" | "desc";
export type RecurringFrequency = "daily" | "weekly" | "monthly";
export type RecurringStatus = "active" | "paused" | "ended";
export type SavingEntryType = "deposit" | "withdraw";
export type OnboardingState = "active" | "dismissed" | "completed";
export type ThemePreference = "light" | "dark" | "system";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_locale: AppLocale;
  theme_preference: ThemePreference;
  onboarding_state: OnboardingState;
  onboarding_dismissed_at: string | null;
  onboarding_completed_at: string | null;
  timezone: string | null;
  default_currency: string;
  ai_chat_enabled: boolean;
  ai_chat_consent_version: string | null;
  ai_chat_consented_at: string | null;
  plan_type: "free" | "premium";
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_consumed_at: string | null;
};

export type WalletRow = {
  id: string;
  name: string;
  kind: WalletKind;
  owner_user_id: string;
  currency: string;
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
  is_system: boolean;
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
  recurring_transaction_id: string | null;
  recurring_scheduled_for: string | null;
  saving_entry_id: string | null;
  source: TransactionSource;
};

export type RecurringTransactionRow = {
  id: string;
  wallet_id: string;
  category_id: string | null;
  kind: TransactionKind;
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  interval_count: number;
  start_date: string;
  end_date: string | null;
  next_run_at: string;
  status: RecurringStatus;
  last_generated_at: string | null;
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

/** Invitation data without the bearer token — safe for non-owner members. */
export type InvitationRowSafe = Omit<InvitationRow, "token">;

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

export type SavingRow = {
  id: string;
  wallet_id: string;
  name: string;
  target_amount: number | null;
  current_balance: number;
  is_archived: boolean;
};

export type SavingEntryRow = {
  id: string;
  saving_id: string;
  wallet_id: string;
  entry_type: SavingEntryType;
  amount: number;
  happened_at: string;
  note: string | null;
  member_user_id: string | null;
};

export type UserApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type SettingsApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  isRevoked: boolean;
};

export type SettingsData = {
  shell: ShellData;
  apiKeys: SettingsApiKeyItem[];
  preferredLocale: AppLocale;
  themePreference: ThemePreference;
  timezone: string | null;
  defaultCurrency: string;
  aiChatEnabled: boolean;
  aiChatConsentRequired: boolean;
  aiChatConsentVersion: string | null;
  planType: "free" | "premium";
  trialMeta: {
    isTrialActive: boolean;
    trialEndsAt: string | null;
    trialDaysRemaining: number | null;
  };
  aiChatDailyLimit: number | null;
};

export type ShellData = {
  userName: string;
  walletCount: number;
  budgetCount: number;
  memberCount: number;
  primaryWalletId: string | null;
  preferredLocale?: AppLocale;
  themePreference?: ThemePreference;
  onboardingState?: OnboardingState;
  onboardingDismissedAt?: string | null;
  onboardingCompletedAt?: string | null;
  timezone?: string | null;
  defaultCurrency?: string;
};

export type DashboardOnboardingStep = {
  id: "create_wallet" | "add_transaction" | "organize_wallet" | "start_saving";
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  isComplete: boolean;
};

export type DashboardOnboarding = {
  isVisible: boolean;
  state: OnboardingState;
  completedSteps: number;
  totalSteps: number;
  steps: DashboardOnboardingStep[];
};

export type WalletSummary = {
  id: string;
  name: string;
  kind: WalletKind;
  role: WalletRole;
  members: number;
  availableBalance: number;
  savingBalance: number;
  totalBalance: number;
  spentThisMonth: number;
  budgetThisMonth: number;
  currency: string;
};

export type DashboardRecentTransaction = {
  id: string;
  walletId: string;
  walletName: string;
  category: string;
  categoryColor: string;
  title: string;
  kind: TransactionKind;
  amount: number;
  date: string;
  splitLabel: string;
  walletCurrency: string;
};

export type DashboardCategorySpend = {
  name: string;
  value: number;
  color: string;
};

export type DailyExpenseItem = {
  day: number;
  dayLabel: string;
  date: string;
  amount: number;
  isToday: boolean;
};

export type DashboardData = {
  shell: ShellData;
  onboarding: DashboardOnboarding;
  totalAvailableBalance: number;
  totalSavingBalance: number;
  totalBalance: number;
  totalExpenseThisMonth: number;
  totalIncomeThisMonth: number;
  outstandingSplit: number;
  wallets: WalletSummary[];
  recentTransactions: DashboardRecentTransaction[];
  categorySpend: DashboardCategorySpend[];
  dailyExpenses: DailyExpenseItem[];
};

export type WalletBundle = {
  shell: ShellData;
  profileMap: Map<string, ProfileRow>;
  categories: CategoryRow[];
  budgets: BudgetRow[];
  members: WalletMemberRow[];
  recurringTransactions: RecurringTransactionRow[];
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  settlements: SettlementRow[];
  templates: TemplateRow[];
  transactions: TransactionRow[];
  invitations: InvitationRowSafe[];
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

export type SavingEntryListItem = {
  id: string;
  type: SavingEntryType;
  amount: number;
  happenedAt: string;
  note: string | null;
  memberUserId: string | null;
  memberName: string | null;
};

export type SavingContributionItem = {
  memberUserId: string;
  memberName: string;
  totalContributed: number;
};

export type SavingListItem = {
  id: string;
  name: string;
  currentBalance: number;
  targetAmount: number | null;
  progressRatio: number;
  progressLabel: string;
  isArchived: boolean;
  entries: SavingEntryListItem[];
  contributions: SavingContributionItem[];
};

export type SavingsPageData = {
  shell: ShellData;
  walletId: string;
  walletName: string;
  walletKind: WalletKind;
  currentUserRole: WalletRole;
  walletSummary: WalletSummary;
  members: WalletMemberRow[];
  memberOptions: Array<{ userId: string; name: string }>;
  savings: SavingListItem[];
};

export type TransactionListItem = {
  id: string;
  kind: TransactionKind;
  source: TransactionSource;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  amount: number;
  note: string | null;
  happenedAt: string;
  splitType: "equal" | "custom" | null;
  splitLabel: string;
  title: string;
  isRecurring: boolean;
  isSavingLinked: boolean;
  isBalanceAdjustment: boolean;
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

export type TransactionHistoryPageData = {
  shell: ShellData;
  walletId: string;
  walletName: string;
  currentUserRole: WalletRole;
  selectedMonth: string;
  categories: CategoryRow[];
  transactions: TransactionListItem[];
  searchQuery: string;
  sortBy: TransactionHistorySortField;
  sortDirection: SortDirection;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type RecurringTransactionListItem = {
  id: string;
  kind: TransactionKind;
  categoryId: string | null;
  categoryName: string;
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  intervalCount: number;
  frequencyLabel: string;
  startDate: string;
  endDate: string | null;
  nextRunAt: string;
  nextRunLabel: string;
  status: RecurringStatus;
  lastGeneratedAt: string | null;
};

export type RecurringTransactionsPageData = {
  shell: ShellData;
  walletId: string;
  walletName: string;
  currentUserRole: WalletRole;
  categories: CategoryRow[];
  recurringTransactions: RecurringTransactionListItem[];
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

export type CategoriesPageData = {
  shell: ShellData;
  walletId: string;
  walletName: string;
  currentUserRole: WalletRole;
  categories: CategoryRow[];
};
