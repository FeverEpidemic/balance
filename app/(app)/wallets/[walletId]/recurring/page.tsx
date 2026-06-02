import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRecurringTransactionsPageData } from "@/lib/data";
import { RecurringPageContent } from "@/components/features/recurring/recurring-page-content";

export default async function RecurringTransactionsPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const { user } = await requireUser();
  const data = await getRecurringTransactionsPageData(user.id, walletId);

  if (!data) {
    notFound();
  }

  return <RecurringPageContent data={data} feedback={query} />;
}
