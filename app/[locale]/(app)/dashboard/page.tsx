import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { DashboardContent } from "@/components/features/dashboard/dashboard-content";

export default async function DashboardPage() {
  const { user } = await requireUser();
  const dashboard = await getDashboardData(user.id);

  return <DashboardContent dashboard={dashboard} />;
}
