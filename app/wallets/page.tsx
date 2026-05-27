import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { WalletsPageContent } from "@/components/features/wallets/wallets-page-content";

export default async function WalletsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireUser();
  const dashboard = await getDashboardData(user.id);

  return <WalletsPageContent dashboard={dashboard} feedback={params} />;
}
