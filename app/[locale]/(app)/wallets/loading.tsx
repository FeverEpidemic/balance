import { getActionLocale } from "@/app/actions/_shared";
import { WalletsLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default async function WalletsLoading() {
  return <WalletsLoadingSkeleton locale={await getActionLocale()} />;
}
