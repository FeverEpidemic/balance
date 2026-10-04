import { defaultLocale, getLocaleTag, translate, type AppLocale } from "@/lib/i18n";
import type {
  SavingContributionItem,
  SavingEntryListItem,
  SavingEntryRow,
  SavingListItem,
  SavingRow,
  SavingsPageData,
  ShellData,
  WalletMemberRow,
  WalletRow,
  WalletSummary
} from "@/lib/data/types";
import { getCurrentUserRole } from "@/lib/data/mappers/wallets";

export function buildSavingContributionItems(args: {
  walletKind: WalletRow["kind"];
  entries: SavingEntryRow[];
  memberRows: WalletMemberRow[];
  profileMap: Map<string, { full_name: string | null; email: string | null }>;
  locale?: AppLocale;
}) {
  const { walletKind, entries, memberRows, profileMap, locale = defaultLocale } = args;

  if (walletKind !== "shared") {
    return [] satisfies SavingContributionItem[];
  }

  const totals = new Map<string, number>();

  entries
    .filter((entry) => entry.entry_type === "deposit" && entry.member_user_id)
    .forEach((entry) => {
      const memberUserId = entry.member_user_id as string;
      totals.set(memberUserId, (totals.get(memberUserId) ?? 0) + entry.amount);
    });

  return memberRows
    .map((member) => {
      const profile = profileMap.get(member.user_id);
      return {
        memberUserId: member.user_id,
        memberName: profile?.full_name || profile?.email || member.user_id,
        totalContributed: totals.get(member.user_id) ?? 0
      } satisfies SavingContributionItem;
    })
    .filter((item) => item.totalContributed > 0)
    .sort(
      (left, right) =>
        right.totalContributed - left.totalContributed ||
        left.memberName.localeCompare(right.memberName, getLocaleTag(locale))
    );
}

export function buildSavingListItems(args: {
  wallet: WalletRow;
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  memberRows: WalletMemberRow[];
  profileMap: Map<string, { full_name: string | null; email: string | null }>;
  locale?: AppLocale;
}) {
  const entriesBySaving = new Map<string, SavingEntryRow[]>();

  args.savingEntries.forEach((entry) => {
    const current = entriesBySaving.get(entry.saving_id) ?? [];
    current.push(entry);
    entriesBySaving.set(entry.saving_id, current);
  });

  return args.savings.map((saving) => {
    const rawEntries = entriesBySaving.get(saving.id) ?? [];
    const entries = rawEntries
      .map((entry) => {
        const profile = entry.member_user_id ? args.profileMap.get(entry.member_user_id) : null;

        return {
          id: entry.id,
          type: entry.entry_type,
          amount: entry.amount,
          happenedAt: entry.happened_at,
          note: entry.note,
          memberUserId: entry.member_user_id,
          memberName: profile?.full_name || profile?.email || null
        } satisfies SavingEntryListItem;
      })
      .sort((left, right) => right.happenedAt.localeCompare(left.happenedAt));

    const progressRatio = saving.target_amount && saving.target_amount > 0 ? Math.min((saving.current_balance / saving.target_amount) * 100, 100) : 0;

    return {
      id: saving.id,
      name: saving.name,
      currentBalance: saving.current_balance,
      targetAmount: saving.target_amount,
      progressRatio,
      progressLabel:
        saving.target_amount && saving.target_amount > 0
          ? translate(args.locale ?? defaultLocale, "savings.progressLabel", { percent: Math.round(progressRatio) })
          : translate(args.locale ?? defaultLocale, "savings.noTarget"),
      isArchived: saving.is_archived,
      entries,
      contributions: buildSavingContributionItems({
        walletKind: args.wallet.kind,
        entries: rawEntries,
        memberRows: args.memberRows,
        profileMap: args.profileMap,
        locale: args.locale
      })
    } satisfies SavingListItem;
  });
}

export function createSavingsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  memberRows: WalletMemberRow[];
  profileMap: Map<string, { full_name: string | null; email: string | null }>;
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  walletSummary: WalletSummary;
  locale?: AppLocale;
}) {
  const { shell, wallet, memberships, memberRows, profileMap, savings, savingEntries, walletSummary, locale = defaultLocale } = args;

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    walletKind: wallet.kind,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    walletSummary,
    members: memberRows,
    memberOptions: memberRows.map((member) => {
      const profile = profileMap.get(member.user_id);
      return {
        userId: member.user_id,
        name: profile?.full_name || profile?.email || member.user_id
      };
    }),
    savings: buildSavingListItems({
      wallet,
      savings: savings.filter((saving) => saving.wallet_id === wallet.id),
      savingEntries: savingEntries.filter((entry) => entry.wallet_id === wallet.id),
      memberRows,
      profileMap,
      locale
    })
  } satisfies SavingsPageData;
}
