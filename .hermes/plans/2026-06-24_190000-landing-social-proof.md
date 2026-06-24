# Landing Page Part 2 — Social Proof, Screenshots, Metrics

> **For Hermes:** Execute task-by-task, commit each. Plan ini mengasumsikan Plan 1 (`landing-copy-rewrite`) sudah dieksekusi. Kalau belum, jalankan Plan 1 dulu.

**Goal:** Tambah 3 section baru ke landing page — App Preview (screenshots), Trust Metrics, dan Testimonials — plus comparison table di pricing section. Ini nge-cover semua gap credibility yang bikin landing page keliatan "MVP."

**Architecture:** 3 section baru + 1 enhancement, disisipkan di antara section existing. Semua data dari i18n JSON. Layout pake class utility existing (`card`, `glass-panel`, `headline-*`, `eyebrow`). Gak ada component baru — semua inline di `page.tsx`.

**Tech Stack:** Next.js 16 Server Component · `Button` · `AppIcon` · `Badge` · i18n JSON · Tailwind v4

---

## Placement Map

```
┌──────────────────────────────────────────────┐
│  Header                                       │
├──────────────────────────────────────────────┤
│  Hero                    (existing)           │
├──────────────────────────────────────────────┤
│  Features                (existing)           │
├──────────────────────────────────────────────┤
│  App Preview    [NEW]    ← Task 1             │
├──────────────────────────────────────────────┤
│  Trust Metrics  [NEW]    ← Task 2             │
├──────────────────────────────────────────────┤
│  Steps                   (existing)           │
├──────────────────────────────────────────────┤
│  Use Cases               (existing)           │
├──────────────────────────────────────────────┤
│  Testimonials   [NEW]    ← Task 3             │
├──────────────────────────────────────────────┤
│  Pricing                 (existing)           │
├──────────────────────────────────────────────┤
│  Pricing Compare [NEW]   ← Task 4             │
├──────────────────────────────────────────────┤
│  FAQ                     (existing)           │
├──────────────────────────────────────────────┤
│  CTA                     (existing)           │
├──────────────────────────────────────────────┤
│  Footer                  (existing)           │
└──────────────────────────────────────────────┘
```

---

## Task 1: App Preview Section — Screenshot Gallery

**Objective:** Tampilin 3 screenshot statis dari app asli (dashboard, transaksi, AI chat) supaya visitor bisa lihat UI sebelum daftar.

**Files:**
- Create: `components/landing/landing-app-preview.tsx` — client component (CSS mockup, no image assets)
- Modify: `app/[locale]/page.tsx` — import + render
- Modify: `messages/id.json` — 6 keys (title + 3 labels)
- Modify: `messages/en.json` — 6 keys

### Step 1.1: Create the preview component

Menggunakan pattern yang sama dengan `LandingHeroMockup` — browser-frame card dengan konten CSS-mockup, tapi **static** (no carousel). 3 card sejajar:

```tsx
// components/landing/landing-app-preview.tsx
"use client";

export function LandingAppPreview() {
  return (
    <div className="grid gap-5 md:grid-cols-3" aria-hidden="true">
      {/* Dashboard preview */}
      <div className="relative overflow-hidden rounded-[1.25rem] border bg-card shadow-serene transition hover:scale-[1.02] hover:shadow-float">
        <div className="flex h-8 items-center gap-2 border-b bg-muted/30 px-3">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-green-400/70" />
          </div>
        </div>
        <DashboardMini />
        <div className="border-t bg-muted/10 px-3 py-2 text-center">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Dashboard
          </span>
        </div>
      </div>

      {/* Transactions preview */}
      <div className="relative overflow-hidden rounded-[1.25rem] border bg-card shadow-serene transition hover:scale-[1.02] hover:shadow-float">
        <div className="flex h-8 items-center gap-2 border-b bg-muted/30 px-3">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-green-400/70" />
          </div>
        </div>
        <TransactionsMini />
        <div className="border-t bg-muted/10 px-3 py-2 text-center">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Transaksi
          </span>
        </div>
      </div>

      {/* AI Chat preview */}
      <div className="relative overflow-hidden rounded-[1.25rem] border bg-card shadow-serene transition hover:scale-[1.02] hover:shadow-float">
        <div className="flex h-8 items-center gap-2 border-b bg-muted/30 px-3">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            <span className="h-2 w-2 rounded-full bg-green-400/70" />
          </div>
        </div>
        <AiChatMini />
        <div className="border-t bg-muted/10 px-3 py-2 text-center">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            AI Chat
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Three mini preview components** — scaled-down versions of actual app UI:

```tsx
// DashboardMini — shows balance + two stat cards + budget bar
function DashboardMini() {
  return (
    <div className="flex flex-col gap-3 p-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div>
        <p className="font-label text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Saldo Utama</p>
        <p className="metric mt-1 text-xl">Rp12.450.000</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/40 bg-card p-2.5">
          <p className="font-label text-[8px] uppercase tracking-[0.12em] text-muted-foreground">Pengeluaran</p>
          <p className="metric mt-1 text-sm text-danger">Rp3.200.000</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card p-2.5">
          <p className="font-label text-[8px] uppercase tracking-[0.12em] text-muted-foreground">Pemasukan</p>
          <p className="metric mt-1 text-sm text-success">Rp5.100.000</p>
        </div>
      </div>
      <div className="rounded-lg bg-muted p-2.5">
        <div className="flex justify-between">
          <p className="font-label text-[8px] uppercase tracking-[0.12em] text-muted-foreground">Kebutuhan Pokok</p>
          <p className="font-label text-[8px] text-primary">68%</p>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-card">
          <div className="h-1.5 w-[68%] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

// TransactionsMini — shows 3 transaction rows
function TransactionsMini() {
  const txRows = [
    { date: "17 Jun", cat: "Makan", amount: "Rp45.000", exp: true },
    { date: "17 Jun", cat: "Transport", amount: "Rp22.000", exp: true },
    { date: "16 Jun", cat: "Gaji", amount: "Rp4.200.000", exp: false },
  ];
  return (
    <div className="flex flex-col gap-2 p-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {txRows.map((tx) => (
        <div key={`${tx.date}-${tx.cat}`} className="flex items-center justify-between rounded-lg border border-border/30 bg-card px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-label text-[9px] text-muted-foreground">{tx.date}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-label text-[8px]">{tx.cat}</span>
          </div>
          <span className={`metric text-xs ${tx.exp ? "text-danger" : "text-success"}`}>
            {tx.exp ? `-${tx.amount}` : `+${tx.amount}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// AiChatMini — shows a mock AI conversation
function AiChatMini() {
  return (
    <div className="flex flex-col gap-2.5 p-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="rounded-xl bg-muted px-3 py-2.5">
        <p className="font-label text-[9px] text-muted-foreground">Kamu</p>
        <p className="mt-1 text-xs">Rekap pengeluaran minggu ini</p>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary-soft/40 px-3 py-2.5">
        <p className="font-label text-[9px] text-primary">AI</p>
        <p className="mt-1 text-xs">Minggu ini total Rp850rb — makan Rp320rb (38%), transport Rp180rb (21%)...</p>
      </div>
      <div className="rounded-xl bg-muted px-3 py-2.5">
        <p className="font-label text-[9px] text-muted-foreground">Kamu</p>
        <p className="mt-1 text-xs">Catat kopi 35rb pagi ini</p>
      </div>
    </div>
  );
}
```

> **Kenapa CSS mockup, bukan screenshot image:** Inkonsistensi dark mode. Screenshot PNG gak adaptif — harus punya versi light + dark. CSS mockup otomatis ikut tema. Sama kaya `LandingHeroMockup`.

### Step 1.2: Add i18n keys

**id.json:**
```json
"previewEyebrow": "Lihat aplikasinya",
"previewTitle": "Seperti ini tampilan Balance di dalam",
"previewDescription": "Dashboard ringkas, transaksi gampang dicatat, dan AI yang bantu baca kondisi keuangan pakai bahasa sehari-hari.",
"previewDashboardLabel": "Dashboard",
"previewTransactionsLabel": "Transaksi",
"previewAiChatLabel": "AI Chat"
```

**en.json:**
```json
"previewEyebrow": "See the app",
"previewTitle": "This is what Balance looks like inside",
"previewDescription": "A compact dashboard, easy transaction logging, and AI that helps you understand your finances in plain language.",
"previewDashboardLabel": "Dashboard",
"previewTransactionsLabel": "Transactions",
"previewAiChatLabel": "AI Chat"
```

### Step 1.3: Insert section in page.tsx

After Features section (i.e., after `</section>` closing the features `<section>`), insert:

```tsx
{/* App Preview Section */}
<section className="fade-in-section section-gap">
  <div className="max-w-2xl">
    <p className="eyebrow">{t("landing.previewEyebrow")}</p>
    <h2 className="headline-lg mt-3">{t("landing.previewTitle")}</h2>
    <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
      {t("landing.previewDescription")}
    </p>
  </div>
  <div className="mt-10">
    <LandingAppPreview />
  </div>
</section>
```

Import di page.tsx:
```tsx
import { LandingAppPreview } from "@/components/landing/landing-app-preview";
```

**Commit:**
```bash
git add components/landing/landing-app-preview.tsx app/[locale]/page.tsx messages/id.json messages/en.json
git commit -m "feat: add app preview screenshot section to landing page"
```

---

## Task 2: Trust Metrics Bar

**Objective:** Baris 3 angka kredibilitas — simple, impactful, social proof lewat numbers.

**Files:**
- Modify: `app/[locale]/page.tsx` — inline JSX, no new component
- Modify: `messages/id.json` — 3 value + 3 label keys
- Modify: `messages/en.json` — 3 value + 3 label keys

### Step 2.1: Add i18n keys

**id.json:**
```json
"metricsEyebrow": "Angka",
"metricsTitle": "Balance dalam angka",
"metric1Value": "500+",
"metric1Label": "Dompet dibuat",
"metric2Value": "2.000+",
"metric2Label": "Transaksi tercatat",
"metric3Value": "99,9%",
"metric3Label": "Uptime"
```

**en.json:**
```json
"metricsEyebrow": "By the numbers",
"metricsTitle": "Balance in numbers",
"metric1Value": "500+",
"metric1Label": "Wallets created",
"metric2Value": "2,000+",
"metric2Label": "Transactions recorded",
"metric3Value": "99.9%",
"metric3Label": "Uptime"
```

> **Catatan jujur:** "500+" dan "2.000+" adalah placeholder numbers. Ganti dengan angka riil sebelum production. "99,9% uptime" bisa diklaim kalau pake Supabase hosted (SLA 99.9%). Kalau self-hosted, ganti jadi metrik lain: "2 bahasa" atau "24/7 AI".

### Step 2.2: Insert section in page.tsx

After App Preview section (Task 1), insert:

```tsx
{/* Trust Metrics */}
<section className="fade-in-section section-gap">
  <div className="overflow-hidden rounded-[2rem] bg-card-elevated px-6 py-10 md:px-12 md:py-12 border border-border/30">
    <div className="max-w-2xl">
      <p className="eyebrow">{t("landing.metricsEyebrow")}</p>
      <h2 className="headline-lg mt-3">{t("landing.metricsTitle")}</h2>
    </div>
    <div className="mt-10 grid gap-8 text-center sm:grid-cols-3">
      <div>
        <p className="metric text-4xl font-bold text-primary md:text-5xl">
          {t("landing.metric1Value")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t("landing.metric1Label")}</p>
      </div>
      <div>
        <p className="metric text-4xl font-bold text-primary md:text-5xl">
          {t("landing.metric2Value")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t("landing.metric2Label")}</p>
      </div>
      <div>
        <p className="metric text-4xl font-bold text-primary md:text-5xl">
          {t("landing.metric3Value")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t("landing.metric3Label")}</p>
      </div>
    </div>
  </div>
</section>
```

**Why `bg-card-elevated` + border:** Muted background biar metric numbers pop. Beda dari section putih sebelumnya — kasih visual break.

**Commit:**
```bash
git add app/[locale]/page.tsx messages/id.json messages/en.json
git commit -m "feat: add trust metrics bar to landing page"
```

---

## Task 3: Testimonials Section

**Objective:** 3 quote cards dari "pengguna awal." Placeholder content — ganti kalo udah ada real testimonials.

**Files:**
- Modify: `app/[locale]/page.tsx` — inline JSX
- Modify: `messages/id.json` — 3 quote + 3 name + 3 role keys + section header
- Modify: `messages/en.json` — mirror

### Step 3.1: Add i18n keys

**id.json:**
```json
"testimonialsEyebrow": "Testimoni",
"testimonialsTitle": "Kata pengguna awal Balance",
"testimonial1Quote": "Akhirnya ada aplikasi yang gak bikin pusing. Saya dan istri sekarang bisa lihat pengeluaran bareng tanpa ribut soal angka.",
"testimonial1Name": "Rizky & Dina",
"testimonial1Role": "Pengguna wallet bersama",
"testimonial2Quote": "AI Chat-nya beneran bantu. Saya tinggal ngomong 'catat belanja 150rb' dan langsung masuk. Gak perlu buka-buka kategori lagi.",
"testimonial2Name": "Andre",
"testimonial2Role": "Freelancer, pengguna premium",
"testimonial3Quote": "Yang paling saya suka: simpel. Gak ada grafik aneh-aneh, gak ada notifikasi promosi. Cuma catatan uang yang bikin tenang.",
"testimonial3Name": "Maya",
"testimonial3Role": "Ibu rumah tangga, pengguna free"
```

**en.json:**
```json
"testimonialsEyebrow": "Testimonials",
"testimonialsTitle": "What early users say",
"testimonial1Quote": "Finally, an app that doesn't add to the stress. My wife and I can now track our spending together without arguing about numbers.",
"testimonial1Name": "Rizky & Dina",
"testimonial1Role": "Shared wallet users",
"testimonial2Quote": "The AI Chat genuinely helps. I just say 'log 150k groceries' and it's recorded. No more digging through categories.",
"testimonial2Name": "Andre",
"testimonial2Role": "Freelancer, premium user",
"testimonial3Quote": "What I love most: it's simple. No weird charts, no promo notifications. Just clean money tracking that keeps me calm.",
"testimonial3Name": "Maya",
"testimonial3Role": "Homemaker, free user"
```

### Step 3.2: Insert section in page.tsx

After Use Cases section, before Pricing section, insert:

```tsx
{/* Testimonials */}
<section className="fade-in-section section-gap">
  <div className="max-w-2xl">
    <p className="eyebrow">{t("landing.testimonialsEyebrow")}</p>
    <h2 className="headline-lg mt-3">{t("landing.testimonialsTitle")}</h2>
  </div>
  <div className="mt-8 grid gap-5 md:grid-cols-3">
    {[
      { quote: t("landing.testimonial1Quote"), name: t("landing.testimonial1Name"), role: t("landing.testimonial1Role") },
      { quote: t("landing.testimonial2Quote"), name: t("landing.testimonial2Name"), role: t("landing.testimonial2Role") },
      { quote: t("landing.testimonial3Quote"), name: t("landing.testimonial3Name"), role: t("landing.testimonial3Role") },
    ].map((tItem) => (
      <article key={tItem.name} className="card card-interactive-glow flex flex-col border border-border/40 p-6">
        {/* Quote icon */}
        <svg className="mb-4 h-6 w-6 text-primary/40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
        </svg>
        <blockquote className="flex-1 text-sm leading-7 text-muted-foreground">
          {tItem.quote}
        </blockquote>
        <div className="mt-6 border-t border-border/30 pt-4">
          <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            {tItem.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{tItem.role}</p>
        </div>
      </article>
    ))}
  </div>
</section>
```

**Why SVG quote icon, not AppIcon:** Quote mark icon bukan dari AppIcon set (gak ada `"quote"` name). SVG inline lebih ringan dari nambahin icon baru. `aria-hidden="true"` karena dekoratif.

**Why `card-interactive-glow`:** Biar card lift on hover — subtle interaction.

**Commit:**
```bash
git add app/[locale]/page.tsx messages/id.json messages/en.json
git commit -m "feat: add testimonials section to landing page"
```

---

## Task 4: Pricing Comparison Table

**Objective:** Di bawah pricing cards, tambah tabel perbandingan fitur detail. Ini ngasih user alasan buat upgrade.

**Files:**
- Modify: `app/[locale]/page.tsx` — inline after pricing cards
- Modify: `messages/id.json` — 6-8 comparison row keys
- Modify: `messages/en.json` — mirror

### Step 4.1: Add i18n keys

**id.json:**
```json
"pricingCompareTitle": "Perbandingan fitur",
"pricingCompareFeature": "Fitur",
"pricingCompareFree": "Free",
"pricingComparePremium": "Premium",
"pricingCompareWalletCount": "Jumlah wallet",
"pricingCompareWalletCountFree": "2",
"pricingCompareWalletCountPremium": "Tak terbatas",
"pricingCompareMembers": "Anggota per wallet",
"pricingCompareMembersFree": "2",
"pricingCompareMembersPremium": "10",
"pricingCompareAiDaily": "AI Chat harian",
"pricingCompareAiDailyFree": "5 pesan",
"pricingCompareAiDailyPremium": "Tak terbatas",
"pricingCompareReportHistory": "Riwayat laporan",
"pricingCompareReportHistoryFree": "3 bulan",
"pricingCompareReportHistoryPremium": "12 bulan",
"pricingCompareExport": "Ekspor data",
"pricingCompareExportFree": "Excel",
"pricingCompareExportPremium": "Excel + PDF",
"pricingCompareSharedWallets": "Wallet bersama",
"pricingCompareSharedWalletsFree": "1",
"pricingCompareSharedWalletsPremium": "Tak terbatas"
```

**en.json:** Mirror dengan English values.

### Step 4.2: Render comparison table

Di page.tsx, di bawah pricing cards `<div>`, before FAQ section:

```tsx
{/* Pricing Comparison Table */}
<div className="mt-12 fade-in-section">
  <div className="overflow-hidden rounded-[1.5rem] border border-border/40 bg-card p-1">
    <table className="w-full">
      <thead>
        <tr className="border-b border-border/30">
          <th className="px-5 py-4 text-left font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {t("landing.pricingCompareFeature")}
          </th>
          <th className="px-5 py-4 text-center font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {t("landing.pricingCompareFree")}
          </th>
          <th className="px-5 py-4 text-center font-label text-xs uppercase tracking-[0.14em] bg-primary-soft/40 rounded-t-lg">
            <span className="text-primary-strong">{t("landing.pricingComparePremium")}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {[
          { feature: t("landing.pricingCompareWalletCount"), free: t("landing.pricingCompareWalletCountFree"), premium: t("landing.pricingCompareWalletCountPremium") },
          { feature: t("landing.pricingCompareMembers"), free: t("landing.pricingCompareMembersFree"), premium: t("landing.pricingCompareMembersPremium") },
          { feature: t("landing.pricingCompareAiDaily"), free: t("landing.pricingCompareAiDailyFree"), premium: t("landing.pricingCompareAiDailyPremium") },
          { feature: t("landing.pricingCompareReportHistory"), free: t("landing.pricingCompareReportHistoryFree"), premium: t("landing.pricingCompareReportHistoryPremium") },
          { feature: t("landing.pricingCompareExport"), free: t("landing.pricingCompareExportFree"), premium: t("landing.pricingCompareExportPremium") },
          { feature: t("landing.pricingCompareSharedWallets"), free: t("landing.pricingCompareSharedWalletsFree"), premium: t("landing.pricingCompareSharedWalletsPremium") },
        ].map((row, i) => (
          <tr key={row.feature} className={i % 2 === 0 ? "bg-muted/40" : ""}>
            <td className="px-5 py-3 text-sm font-medium text-foreground">{row.feature}</td>
            <td className="px-5 py-3 text-center text-sm text-muted-foreground">{row.free}</td>
            <td className="px-5 py-3 text-center text-sm font-medium text-primary-strong bg-primary-soft/20">
              {row.premium}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**Why table, not cards:** Pricing cards bagus buat overview. Table bagus buat comparison detail. Dua-duanya serve purpose berbeda — user yang research-oriented bakal scroll ke table.

**Why `bg-primary-soft/20` di Premium column:** Visual reinforcement — Premium column "glowing" subtle. User langsung tau mana yang lebih baik.

**Commit:**
```bash
git add app/[locale]/page.tsx messages/id.json messages/en.json
git commit -m "feat: add pricing comparison table to landing page"
```

---

## Verification

### Typecheck + Build

```bash
npm run typecheck   # must pass
npm run build       # must succeed, semua route OK
```

### Visual Checklist

```
□ mybalance.my.id (light mode)
  □ App Preview: 3 browser-frame card sejajar
    □ Dashboard card: saldo + stats + budget bar
    □ Transactions card: 3 row transaksi
    □ AI Chat card: mock conversation
    □ Hover: scale 1.02 + shadow
  □ Trust Metrics: 3 angka besar (500+, 2000+, 99.9%)
    □ Responsive: stack di mobile, 3-col di desktop
  □ Testimonials: 3 quote card
    □ Quote text, SVG icon, name + role
    □ Hover: card lift effect
  □ Pricing Comparison Table: 6 rows
    □ Premium column highlighted
    □ Striped rows (even rows bg)

□ mybalance.my.id (dark mode)
  □ App Preview cards adapt ke dark theme
  □ Metric numbers tetap kontras
  □ Quote cards readable
  □ Table border/rows visible

□ mybalance.my.id/en
  □ Semua copy English

□ Mobile (< 768px)
  □ App Preview: 3 card stack vertikal
  □ Metrics: 3 angka stack vertikal
  □ Testimonials: 3 card stack vertikal
  □ Table: horizontal scroll (overflow-x-auto)
```

---

## File Summary

| # | File | Action | Lines Δ |
|---|------|--------|---------|
| 1 | `components/landing/landing-app-preview.tsx` | Create | ~130 lines |
| 2 | `app/[locale]/page.tsx` | Modify — 3 sections + 1 table | ~120 lines |
| 3 | `messages/id.json` | Modify — 35+ keys | ~60 lines |
| 4 | `messages/en.json` | Modify — mirror | ~60 lines |

### Yang TIDAK Berubah

| Scope | Kenapa |
|-------|--------|
| Header, Hero, Features, Steps, Use Cases | Section existing gak disentuh |
| Pricing card styling | Cuma tambah table di bawah, cards unchanged |
| FAQ, CTA, Footer | Gak disentuh |
| `LandingScrollObserver` | Animasi fade-in otomatis untuk section baru |
| Dark mode overrides | Section baru pake semantik token (`bg-card`, `text-muted-foreground`) — auto-adapt |
| Mobile breakpoints | Grid responsif via Tailwind utility existing |

---

## Catatan Jujur

- **Metrics numbers adalah placeholder.** "500+", "2.000+" — ganti dengan angka riil dari Supabase query atau update manual tiap milestone. Jangan deploy ke production dengan placeholder numbers tanpa disclaimer internal.
- **Testimonials adalah placeholder.** Kalau belum ada real user testimonials, ini acceptable sebagai "aspirational copy" — tapi ganti begitu ada user nyata yang kasih feedback.
- **Screenshots adalah CSS mockup, bukan gambar asli.** Ini tradeoff yang disengaja: dark mode compatibility vs photorealism. Kalau mau screenshot asli, butuh `<Image>` + dark mode detection + dua versi gambar.
