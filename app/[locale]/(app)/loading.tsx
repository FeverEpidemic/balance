import { getActionLocale } from "@/app/actions/_shared";
import { AppAreaLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default async function AppAreaLoading() {
  return <AppAreaLoadingSkeleton locale={await getActionLocale()} />;
}
