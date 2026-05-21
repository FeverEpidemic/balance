import Link from "next/link";
import { Notice } from "@/components/ui/notice";

export default async function AuthErrorPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page-wrap section-gap">
      <div className="mx-auto max-w-xl card">
        <p className="eyebrow">Auth Error</p>
        <h1 className="headline-lg mt-3">Verifikasi tidak berhasil</h1>
        <div className="mt-6">
          <Notice tone="error">{params.message ?? "Tautan autentikasi tidak dapat diproses."}</Notice>
        </div>
        <div className="mt-6">
          <Link href="/login" className="font-label text-sm text-primary">
            Kembali ke login
          </Link>
        </div>
      </div>
    </main>
  );
}
