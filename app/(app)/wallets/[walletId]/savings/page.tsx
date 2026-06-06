import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSavingsPageData } from "@/lib/data";
import { SavingsPageContent } from "@/components/features/savings/savings-page-content";

export default async function SavingsPage({
  params
}: {
  params: Promise<{ walletId: string }>;
}) {
  const { walletId } = await params;
  const { user } = await requireUser();
  const data = await getSavingsPageData(user.id, walletId);

  if (!data) {
    notFound();
  }

  return <SavingsPageContent data={data} />;
}
