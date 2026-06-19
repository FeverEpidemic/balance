"use client";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell
      currentPath=""
      title="Error"
      subtitle="Terjadi kesalahan"
      userName=""
      walletCount={0}
      budgetCount={0}
      memberCount={0}
      primaryWalletId=""
      currentWalletId=""
    >
      <section className="grid gap-4">
        <div className="card">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <h3 className="headline-md">Terjadi Kesalahan</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.
            </p>
            <div className="flex gap-2">
              <Button variant="soft" onClick={reset}>
                Coba Lagi
              </Button>
              <Button variant="ghost" href="/">
                Ke Beranda
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
