import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCategoriesPageData } from "@/lib/data";
import { CategoriesPageContent } from "@/components/features/categories/categories-page-content";

export default async function CategoriesPage({
  params
}: {
  params: Promise<{ walletId: string }>;
}) {
  const { walletId } = await params;
  const { user } = await requireUser();
  const data = await getCategoriesPageData(user.id, walletId);

  if (!data) {
    notFound();
  }

  return <CategoriesPageContent data={data} />;
}
