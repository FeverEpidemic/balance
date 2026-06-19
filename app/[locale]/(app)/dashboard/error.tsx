"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="card">
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <h3 className="headline-md">Gagal Memuat Dashboard</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Maaf, terjadi kesalahan saat memuat halaman dashboard. Silakan coba lagi.
          </p>
          <div className="flex gap-2">
            <Button variant="soft" onClick={reset}>
              Coba Lagi
            </Button>
            <Button variant="ghost" href="/dashboard">
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
