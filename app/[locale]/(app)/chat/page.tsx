import { ChatPageContent } from "@/components/features/chat/chat-page-content";
import { getAiChatComplianceState } from "@/lib/ai/compliance";
import { requireUser } from "@/lib/auth";
import { getShellData } from "@/lib/data";
import { queryCurrentUserWalletIds, queryProfiles, queryWallets } from "@/lib/data/queries";
import { resolveLocale } from "@/lib/i18n";

export default async function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { user } = await requireUser();
  const [shell, memberships, profiles] = await Promise.all([getShellData(user.id), queryCurrentUserWalletIds(user.id), queryProfiles([user.id])]);
  const wallets = await queryWallets(memberships.map((membership) => membership.wallet_id));
  const aiCompliance = getAiChatComplianceState(profiles[0]);

  return (
    <ChatPageContent
      locale={locale}
      shell={shell}
      aiCompliance={aiCompliance}
      wallets={wallets.map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        kind: wallet.kind
      }))}
    />
  );
}
