import { Button } from "@/components/ui/button";
import { resolveLocale } from "@/lib/i18n";

export default async function OfflinePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  return (
    <main className="page-wrap flex min-h-screen items-center py-10">
      <section className="glass-panel-strong mx-auto w-full max-w-2xl rounded-[2rem] p-6 shadow-float md:p-10">
        <p className="eyebrow">Mode offline</p>
        <h1 className="headline-lg mt-4 max-w-xl">Koneksi internet sedang tidak tersedia.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
          Balance belum menyimpan data wallet untuk dipakai penuh saat offline. Begitu koneksi kembali, Anda bisa lanjut
          masuk dan melihat data seperti biasa.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card-muted rounded-[1.5rem] p-5">
            <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">Yang bisa dicoba</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Cek koneksi, pindah jaringan, atau buka lagi aplikasi beberapa saat lagi.
            </p>
          </div>
          <div className="card-muted rounded-[1.5rem] p-5">
            <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">Status v1</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Versi PWA ini fokus ke installability dan fallback yang rapi, belum ke penyimpanan data offline.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/">{locale === "en" ? "Try again" : "Coba lagi"}</Button>
          <Button href="/login" variant="ghost">
            {locale === "en" ? "Open login" : "Buka login"}
          </Button>
        </div>
      </section>
    </main>
  );
}
