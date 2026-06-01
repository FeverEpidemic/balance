import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const featureCards = [
  {
    title: "Catatan cash flow yang enak dibaca",
    description: "Pemasukan, pengeluaran, dan saldo terasa lebih gampang dipantau tanpa harus buka banyak sheet."
  },
  {
    title: "Budget bulanan yang lebih kebayang",
    description: "Lihat kategori mana yang masih aman dan mana yang mulai minta rem sebelum akhir bulan."
  },
  {
    title: "Split bill tanpa chat panjang",
    description: "Bagi pengeluaran bareng, cek sisa settlement, lalu lanjut hidup tanpa ribet hitung manual."
  },
  {
    title: "Saving tetap nyambung ke wallet",
    description: "Setor dan tarik tabungan tetap kebaca di arus uang utama, jadi gambarannya tetap utuh."
  }
];

const steps = [
  {
    number: "01",
    title: "Bikin wallet yang kamu butuhin",
    description: "Pakai buat diri sendiri, atau bikin wallet bareng pasangan, keluarga, dan teman serumah."
  },
  {
    number: "02",
    title: "Catat transaksi seperlunya",
    description: "Masuk, keluar, split bill, sampai tabungan bisa dicatat cepat tanpa alur yang bikin capek."
  },
  {
    number: "03",
    title: "Lihat kondisi uang dengan lebih tenang",
    description: "Cek budget, saldo, dan laporan bulanan buat bantu ambil keputusan tanpa tebak-tebakan."
  }
];

const useCases = [
  {
    title: "Buat keuangan pribadi",
    description: "Cocok kalau kamu mau tahu uang pergi ke mana, jaga budget tetap waras, dan punya ritme finansial yang lebih rapi."
  },
  {
    title: "Buat wallet bareng",
    description: "Pas buat kebutuhan rumah tangga, kos bareng, atau proyek kecil yang butuh catatan uang transparan dan gampang dicek."
  }
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-wrap pb-12 pt-6 md:pb-16 md:pt-8">
      <section className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:py-14">
        <div>
          <p className="eyebrow">Balance | Healthy Financial Healthy Mind</p>
          <h1 className="headline-xl mt-4 max-w-3xl">
            Ngatur uang jadi lebih tenang, baik buat diri sendiri maupun buat bareng-bareng.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Balance bantu kamu nyatet arus uang, jaga budget, bagi tagihan, dan pantau tabungan dalam satu tempat yang
            terasa rapi dari awal sampai akhir bulan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/register">Daftar gratis</Button>
            <Button href="/login" variant="ghost">
              Masuk
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Badge>Bahasa Indonesia</Badge>
            <Badge>Wallet pribadi & bersama</Badge>
            <Badge>Budget, split bill, saving</Badge>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="card-muted p-4">
              <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">Ringkas</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Tampilan utamanya fokus ke hal yang penting, jadi tidak bikin penuh kepala.
              </p>
            </div>
            <div className="card-muted p-4">
              <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">Fleksibel</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Mau dipakai sendiri atau patungan bareng, alurnya tetap terasa nyambung.
              </p>
            </div>
            <div className="card-muted p-4">
              <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">Jelas</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Laporan dan budget membantu kamu lihat kondisi uang tanpa banyak nebak.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-x-8 top-4 h-40 rounded-full bg-primary-soft/60 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,244,237,0.98))] p-4 shadow-float md:p-6">
            <div className="rounded-[1.5rem] bg-primary px-5 py-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-label text-xs uppercase tracking-[0.18em] text-white/70">Ringkasan bulan ini</p>
                  <p className="metric mt-4 text-3xl md:text-[2.5rem]">Rp12.450.000</p>
                </div>
                <div className="rounded-full bg-white/12 px-3 py-2 font-label text-xs text-white">Cash flow aman</div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
                Setelah kebutuhan utama, tagihan bersama, dan target tabungan, uangmu masih kelihatan arah geraknya.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="card p-5">
                <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">Budget makan</p>
                <p className="metric mt-3 text-2xl">68%</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Masih aman buat sisa 12 hari bulan ini.</p>
              </div>
              <div className="card p-5">
                <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">Split belum beres</p>
                <p className="metric mt-3 text-2xl">Rp950.000</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">2 settlement tinggal dicatat biar rapi.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="card-muted p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">Saving tujuan</p>
                    <p className="headline-md mt-2">Dana tenang akhir tahun</p>
                  </div>
                  <Badge>Target 74%</Badge>
                </div>
                <div className="mt-4 h-3 rounded-full bg-white/80">
                  <div className="h-3 w-[74%] rounded-full bg-primary" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Tabungan tetap terasa dekat sama wallet utama, jadi kamu tidak kehilangan konteks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-gap">
        <div className="max-w-2xl">
          <p className="eyebrow">Yang bikin lebih enak dipakai</p>
          <h2 className="headline-lg mt-3">Bukan cuma nyatet transaksi, tapi bantu bikin keputusan terasa lebih ringan.</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {featureCards.map((feature) => (
            <article key={feature.title} className="card">
              <p className="headline-md">{feature.title}</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-gap">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-xl">
            <p className="eyebrow">Cara kerjanya</p>
            <h2 className="headline-lg mt-3">Mulainya cepat, rutinnya juga tidak bikin repot.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Balance dibuat supaya kamu bisa cepat jalan dulu, lalu pelan-pelan punya gambaran finansial yang makin jelas.
            </p>
          </div>
          <div className="grid gap-4">
            {steps.map((step) => (
              <article key={step.number} className="card flex flex-col gap-3 md:flex-row md:items-start md:gap-5">
                <div className="metric text-2xl text-primary">{step.number}</div>
                <div>
                  <p className="headline-md">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground md:text-base">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-gap">
        <div className="grid gap-4 lg:grid-cols-2">
          {useCases.map((useCase) => (
            <article key={useCase.title} className="card-muted rounded-[1.5rem] p-6 md:p-7">
              <p className="eyebrow">Use case</p>
              <h2 className="headline-md mt-3">{useCase.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{useCase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-gap">
        <div className="overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-white shadow-float md:px-10 md:py-10">
          <div className="max-w-3xl">
            <p className="eyebrow text-white/70">Siap mulai?</p>
            <h2 className="headline-lg mt-3 text-white">Kalau kamu ingin hubungan yang lebih tenang sama uang, mulai dari sini dulu.</h2>
            <p className="mt-4 text-base leading-7 text-white/75 md:text-lg">
              Buka akun, bikin wallet pertama, lalu mulai catat seperlunya. Tidak harus langsung sempurna, yang penting
              kamu bisa lihat uangmu dengan lebih jelas dari hari ke hari.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/register" className="bg-white text-primary-strong hover:bg-[#f4f1e5]">
                Daftar gratis
              </Button>
              <Button href="/login" variant="ghost" className="border-white/30 text-white hover:bg-white/10">
                Masuk ke aplikasi
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
