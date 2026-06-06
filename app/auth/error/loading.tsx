import { SimpleCardLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default function AuthErrorLoading() {
  return <SimpleCardLoadingSkeleton eyebrowWidth="w-20" titleWidth="w-64" bodyLines={1} />;
}
