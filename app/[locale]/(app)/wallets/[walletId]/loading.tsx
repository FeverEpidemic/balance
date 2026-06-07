import { getActionLocale } from "@/app/actions/_shared";
import { WalletOverviewLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default async function WalletOverviewLoading() {
  return <WalletOverviewLoadingSkeleton locale={await getActionLocale()} />;
}
