import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRecurringTransactionsPageData } from "@/lib/data";
import { RecurringPageContent } from "@/components/features/recurring/recurring-page-content";

export default async function RecurringTransactionsPage({
  params
}: {
  params: Promise<{ walletId: string }>;
}) {
  const { walletId } = await params;
  const { user } = await requireUser();
  const data = await getRecurringTransactionsPageData(user.id, walletId);

  if (!data) {
    notFound();
  }

  return <RecurringPageContent data={data} />;
}
