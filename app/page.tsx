import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-wrap section-gap">
      <section className="grid items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div>
          <p className="eyebrow">balance</p>
          <h1 className="headline-xl mt-4 max-w-3xl">Keuangan pribadi yang terasa jernih, bukan melelahkan.</h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Catat pemasukan dan pengeluaran, atur budget per kategori, bagi tagihan, dan lihat laporan bulanan dalam satu alur yang rapi untuk layar mobile maupun desktop.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/login">Masuk ke aplikasi</Button>
            <Button href="/register" variant="ghost">
              Daftar akun
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Badge>Wallet pribadi & bersama</Badge>
            <Badge>Split bill equal/custom</Badge>
            <Badge>Budget bulanan</Badge>
          </div>
        </div>

        <div className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,244,237,0.95))] p-4 shadow-float md:p-6">
          <div className="grid gap-4">
            <div className="rounded-2xl bg-primary px-5 py-6 text-white">
              <p className="font-label text-xs uppercase tracking-[0.18em] text-white/70">Arus kas Mei</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="metric text-3xl">Rp12.450.000</p>
                  <p className="mt-2 text-sm text-white/70">Sisa aman setelah kebutuhan utama dan split tagihan.</p>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-2 font-label text-xs">+18%</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <StatCard label="Budget terpakai" value={6350000} detail="70% dari target bulan ini" />
              <StatCard label="Outstanding split" value={950000} detail="2 settlement belum dicatat" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
