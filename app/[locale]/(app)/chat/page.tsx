import { ChatPageContent } from "@/components/features/chat/chat-page-content";
import { requireUser } from "@/lib/auth";
import { getShellData } from "@/lib/data";
import { queryCurrentUserWalletIds, queryWallets } from "@/lib/data/queries";
import { resolveLocale } from "@/lib/i18n";

export default async function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { user } = await requireUser();
  const [shell, memberships] = await Promise.all([getShellData(user.id), queryCurrentUserWalletIds(user.id)]);
  const wallets = await queryWallets(memberships.map((membership) => membership.wallet_id));

  return (
    <ChatPageContent
      locale={locale}
      shell={shell}
      wallets={wallets.map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        kind: wallet.kind
      }))}
    />
  );
}
