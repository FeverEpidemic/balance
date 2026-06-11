import { redirect } from "next/navigation";

export default async function TransactionHistoryPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { walletId } = await params;
  const { month } = await searchParams;
  const query = month ? `?month=${month}&view=history` : "?view=history";
  redirect(`/wallets/${walletId}/transactions${query}`);
}
