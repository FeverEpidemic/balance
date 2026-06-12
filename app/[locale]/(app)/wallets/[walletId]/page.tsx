import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWalletOverviewData } from "@/lib/data";
import { WalletOverviewContent } from "@/components/features/wallets/wallet-overview-content";

export default async function WalletOverviewPage({ params }: { params: Promise<{ walletId: string }> }) {
  const { walletId } = await params;
  const { user } = await requireUser();
  const data = await getWalletOverviewData(user.id, walletId);

  if (!data) {
    notFound();
  }

  return <WalletOverviewContent data={data} />;
}
