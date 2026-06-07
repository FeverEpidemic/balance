import { getActionLocale } from "@/app/actions/_shared";
import { DashboardLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default async function DashboardLoading() {
  return <DashboardLoadingSkeleton locale={await getActionLocale()} />;
}
