import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="page-wrap flex min-h-screen items-center py-10">
      <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,244,237,0.98))] p-6 shadow-float md:p-10">
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
          <Button href="/">Coba lagi</Button>
          <Button href="/login" variant="ghost">
            Buka login
          </Button>
        </div>
      </section>
    </main>
  );
}
