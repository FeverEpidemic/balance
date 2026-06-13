import { redirect } from "next/navigation";

export default async function TransactionHistoryPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ month?: string; q?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const paramsToForward = new URLSearchParams({ view: "history" });

  if (query.month) paramsToForward.set("month", query.month);
  if (query.q) paramsToForward.set("q", query.q);
  if (query.sort) paramsToForward.set("sort", query.sort);
  if (query.dir) paramsToForward.set("dir", query.dir);
  if (query.page) paramsToForward.set("page", query.page);

  redirect(`/wallets/${walletId}/transactions?${paramsToForward.toString()}`);
}
