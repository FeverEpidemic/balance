import { DetailPageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default function TransactionHistoryLoading() {
  return <DetailPageLoadingSkeleton currentPath="/wallets/loading-wallet/transactions/history" title="Histori transaksi" />;
}
