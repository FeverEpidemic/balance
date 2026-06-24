# Landing Page Copywriting & Quick Wins Overhaul

> **For Hermes:** Execute task-by-task, commit each. Focus: copy rewrite (high impact), visual polish (quick wins), structural cleanup. Jangan sentuh layout utama.

**Goal:** Landing page terasa lebih inviting, emotionally resonant, dan conversion-optimized — tanpa ubah struktur halaman.

**Architecture:** Semua copy di `messages/id.json` + `messages/en.json` (i18n key-value). 7 task: hero rewrite, cleanup redundant section, feature icons, pricing CTAs, FAQ swap, mobile nav polish, carousel timing.

**Tech Stack:** Next.js 16 App Router (Server Component page) · i18n JSON messages · `AppIcon` client component · `Button` component

---

## Before/After — Hero Section

```
┌─ SEBELUM ──────────────────────────────────────────────────────┐
│                                                                 │
│  Balance | Chat, langsung tercatat.           ┌────────────┐   │
│                                               │            │   │
│  Chat, langsung tercatat.                     │  Browser   │   │
│  Transaksi manual tetap gratis selamanya.     │  Mockup    │   │
│                                               │  Carousel  │   │
│  Balance mencatat transaksi dari obrolan      │            │   │
│  AI-mu secara otomatis. Mau catat manual?     │  Slide 1   │   │
│  Tidak terbatas. Semua rapi dalam satu        │  Slide 2   │   │
│  wallet.                                      │  Slide 3   │   │
│                                               │            │   │
│  [Daftar gratis]  [Masuk]                     └────────────┘   │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ Ringkas  │ │ Fleksibel│ │  Jelas   │  ← REDUNDANT           │
│  └──────────┘ └──────────┘ └──────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─ SESUDAH ───────────────────────────────────────────────────────┐
│                                                                 │
│  Balance                                        ┌────────────┐  │
│                                                 │            │  │
│  Uangmu jelas.                                  │  Browser   │  │
│  Pikiranmu tenang.                              │  Mockup    │  │
│                                                 │  Carousel  │  │
│  Catat pengeluaran, atur anggaran, dan bagi     │            │  │
│  tagihan — sendiri atau bareng pasangan.        │  Slide 1   │  │
│  Semua rapi tanpa bikin pusing.                 │  Slide 2   │  │
│                                                 │  Slide 3   │  │
│  [Mulai gratis]  [Masuk]                        │            │  │
│                                                 └────────────┘  │
│  (3-card section DIHAPUS — redundant)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Before/After — Feature Cards

```
┌─ SEBELUM ───────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ Catatan arus kas │  │ Anggaran bulanan │                     │
│  │ yang enak dibaca │  │ yang lebih        │                     │
│  │                  │  │ kebayang          │                     │
│  │ Pemasukan,       │  │ Lihat kategori    │                     │
│  │ pengeluaran...   │  │ mana yang...      │                     │
│  └──────────────────┘  └──────────────────┘                     │
│  ❌ No icons — text only                                        │
└─────────────────────────────────────────────────────────────────┘

┌─ SESUDAH ───────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ 📊 Arus kas      │  │ 📈 Anggaran      │                     │
│  │ langsung kebaca  │  │ sisanya jelas    │                     │
│  │                  │  │                  │                     │
│  │ Pemasukan,       │  │ Lihat kategori   │                     │
│  │ pengeluaran...   │  │ mana yang...     │                     │
│  └──────────────────┘  └──────────────────┘                     │
│  ✅ AppIcon component di tiap card + copy lebih pendek           │
└─────────────────────────────────────────────────────────────────┘
```

## Before/After — Pricing Cards

```
┌─ SEBELUM ───────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ Free             │  │ Premium    ⭐    │                     │
│  │ Rp0              │  │ Rp29.000/bulan   │                     │
│  │ ✓ transaksi      │  │ ✓ semua free +   │                     │
│  │ ✓ AI 5/hari      │  │ ✓ AI unlimited   │                     │
│  │ ✓ laporan 3 bln  │  │ ✓ PDF export     │                     │
│  │                  │  │                  │                     │
│  │ ❌ NO CTA        │  │ ❌ NO CTA        │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘

┌─ SESUDAH ───────────────────────────────────────────────────────┐
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ Free             │  │ Premium    ⭐    │                     │
│  │ Rp0              │  │ Rp29.000/bulan   │                     │
│  │ ✓ transaksi      │  │ ✓ semua free +   │                     │
│  │ ✓ AI 5/hari      │  │ ✓ AI unlimited   │                     │
│  │ ✓ laporan 3 bln  │  │ ✓ PDF export     │                     │
│  │                  │  │                  │                     │
│  │ [Mulai gratis]   │  │ [Coba Premium]   │                     │
│  └──────────────────┘  └──────────────────┘                     │
│  ✅ CTA button di masing-masing card                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Task 1: Hero Copy Rewrite

**Objective:** Ganti headline dan deskripsi hero dari feature-focused jadi emotionally resonant value proposition.

**Files:**
- Modify: `messages/id.json` — 4 keys
- Modify: `messages/en.json` — 4 keys (mirror)

### Step 1.1: Update `messages/id.json`

Ganti 4 key di object `"landing"`:

```diff
-  "eyebrow": "Balance | Chat, langsung tercatat.",
+  "eyebrow": "Balance",

-  "title": "Chat, langsung tercatat. Transaksi manual tetap gratis selamanya.",
+  "title": "Uangmu jelas.\nPikiranmu tenang.",

-  "description": "Balance mencatat transaksi dari obrolan AI-mu secara otomatis. Mau catat manual? Tidak terbatas. Semua rapi dalam satu wallet.",
+  "description": "Catat pengeluaran, atur anggaran, dan bagi tagihan — sendiri atau bareng pasangan. Semua rapi tanpa bikin pusing.",

-  "registerButton": "Daftar gratis",
+  "registerButton": "Mulai gratis",
```

**Design decisions:**

| Old | New | Kenapa |
|-----|-----|--------|
| `"Chat, langsung tercatat."` | `"Uangmu jelas. Pikiranmu tenang."` | Old lead dengan fitur AI Chat — visitor gak tau AI Chat itu apa. New lead dengan emotional benefit — semua orang relate sama "uang bikin pusing". 4 kata simetris, mudah diingat. |
| `"\n"` di title | Line break literal | Next.js SSR render `\n` jadi whitespace, bukan `<br>`. Butuh `white-space: pre-line` di CSS atau split ke `<span>`. **Pitfall:** `headline-xl` gak punya `white-space: pre-line`. Fix: tambahin `className="whitespace-pre-line"` di `<h1>` element (page.tsx line 66). |
| `"Daftar gratis"` | `"Mulai gratis"` | "Daftar" = commitment / form / effort. "Mulai" = low barrier / instant. | 
| Panjang deskripsi | 2 kalimat, 24 kata | Old 3 kalimat teknis ("mencatat transaksi dari obrolan AI"). New 2 kalimat benefit ("rapi tanpa bikin pusing"). |

### Step 1.2: Update `messages/en.json`

Mirror changes untuk English:

```diff
-  "eyebrow": "Balance | Chat, instantly recorded.",
+  "eyebrow": "Balance",

-  "title": "Chat, instantly recorded. Manual transactions remain free forever.",
+  "title": "Your money, clear.\nYour mind, calm.",

-  "description": "Balance records transactions from your AI conversations automatically. Prefer manual? No limits. All tidy in one wallet.",
+  "description": "Track spending, set budgets, and split bills — solo or with your partner. Everything tidy, nothing overwhelming.",

-  "registerButton": "Sign up free",
+  "registerButton": "Start free",
```

### Step 1.3: Fix `\n` rendering di `<h1>`

Di `app/[locale]/page.tsx` line 66, `<h1>` perlu support newline:

```diff
  <h1 className="headline-xl mt-4 max-w-3xl leading-tight">
+   {t("landing.title")}
-   {t("landing.title").replace(/\n/g, "<br/>")}  ← DON'T do this (XSS risk)
  </h1>
```

**Better approach:** Split di i18n value dan render dua baris:

**Option A — Change i18n structure (recommended):**

Ganti `landing.title` dari single string jadi object dengan `line1`/`line2`:

```json
"titleLine1": "Uangmu jelas.",
"titleLine2": "Pikiranmu tenang."
```

Lalu di page.tsx:
```tsx
<h1 className="headline-xl mt-4 max-w-3xl leading-tight">
  {t("landing.titleLine1")}
  <br />
  {t("landing.titleLine2")}
</h1>
```

**Ini approach yang dipilih** karena:
- Clean, no CSS hack
- Type-safe (no HTML injection)
- Works di SSR tanpa hydration mismatch
- i18n keys tetap atomic

### Step 1.4: Verify hero layout balance

Karena 3-card section dihapus (Task 2), hero section jadi lebih pendek di sisi kiri. Tapi `LandingHeroMockup` punya `min-h-[22rem] md:min-h-[26rem]` — cukup tinggi untuk balance. **Verify visual** di mobile + desktop setelah deploy.

**Commit:**
```bash
git add messages/id.json messages/en.json app/[locale]/page.tsx
git commit -m "copy: rewrite hero headline to emotional value proposition"
```

---

## Task 2: Remove Redundant 3-Card Section from Hero

**Objective:** Hapus card-grid "Ringkas / Fleksibel / Jelas" yang redundant dengan features section di bawah.

**Files:**
- Modify: `app/[locale]/page.tsx` — lines 75-88

### Step 2.1: Delete the section

```diff
  // page.tsx — after <InstallPrompt />, before closing </div>
- <div className="mt-10 grid gap-4 sm:grid-cols-3">
-   <div className="card-muted rounded-xl border border-border/10 p-4 ...">
-     <p className="font-label text-xs ...">{t("landing.card1Label")}</p>
-     <p className="mt-3 text-sm ...">{t("landing.card1Description")}</p>
-   </div>
-   <div className="card-muted rounded-xl border border-border/10 p-4 ...">
-     <p className="font-label text-xs ...">{t("landing.card2Label")}</p>
-     <p className="mt-3 text-sm ...">{t("landing.card2Description")}</p>
-   </div>
-   <div className="card-muted rounded-xl border border-border/10 p-4 ...">
-     <p className="font-label text-xs ...">{t("landing.card3Label")}</p>
-     <p className="mt-3 text-sm ...">{t("landing.card3Description")}</p>
-   </div>
- </div>
```

### Step 2.2: Mark i18n keys as deprecated

Jangan hapus keys dari JSON dulu — biar gak break jika ada reference tersisa. Tambah comment `// DEPRECATED — removed from hero, safe to delete later`:

```json
"card1Label": "Ringkas",        // DEPRECATED
"card1Description": "...",      // DEPRECATED
"card2Label": "Fleksibel",      // DEPRECATED
"card2Description": "...",      // DEPRECATED
"card3Label": "Jelas",          // DEPRECATED
"card3Description": "...",      // DEPRECATED
```

**Commit:**
```bash
git add app/[locale]/page.tsx messages/id.json messages/en.json
git commit -m "refactor: remove redundant hero 3-card section, deprecate i18n keys"
```

---

## Task 3: Add AppIcon to Feature Cards

**Objective:** Tambah visual icon di tiap feature card biar gak cuma text wall.

**Files:**
- Modify: `app/[locale]/page.tsx` — import + render

### Step 3.1: Add import

```diff
  // page.tsx — add to imports (line 4-11 area)
+ import { AppIcon } from "@/components/ui/app-icon";
```

### Step 3.2: Define icon mapping

Di dalam `HomePage` server component, sebelum `featureCards` array:

```tsx
// Icon mapping for feature cards — matches AppIcon "name" prop type
const featureIcons = [
  "transactions" as const,
  "budgets" as const,
  "settlements" as const,
  "savings" as const,
];
```

### Step 3.3: Render icon in feature card loop

```diff
  {featureCards.map((feature, index) => (
    <article key={feature.title} className="card card-interactive-glow ...">
+     <AppIcon
+       name={featureIcons[index]}
+       className="mb-4 h-8 w-8"
+       tone="primary"
+     />
      <p className="headline-md font-semibold text-foreground">{feature.title}</p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{feature.description}</p>
    </article>
  ))}
```

**Why `h-8 w-8` with `mb-4`:** Icon size seimbang dengan `headline-md` text. Margin bottom kasih breathing room antara icon dan title.

**Commit:**
```bash
git add app/[locale]/page.tsx
git commit -m "feat: add feature icons to landing page cards"
```

---

## Task 4: Add CTA Buttons to Pricing Cards

**Objective:** Pricing cards kasih ajakan bertindak langsung — user gak perlu scroll ke atas/bawah buat daftar.

**Files:**
- Modify: `app/[locale]/page.tsx` — add Button elements
- Modify: `messages/id.json` — 2 new keys
- Modify: `messages/en.json` — 2 new keys

### Step 4.1: Add i18n keys

**id.json:**
```json
"pricingFreeCta": "Mulai gratis",
"pricingPremiumCta": "Coba Premium",
```

**en.json:**
```json
"pricingFreeCta": "Start free",
"pricingPremiumCta": "Try Premium",
```

### Step 4.2: Add Button to Free card

Di dalam Free card `<div>` (sebelum ini cuma list), tambahin setelah `</ul>`:

```tsx
{/* Free Plan — line 162-181 area */}
<div className="card glass-pricing-card ...">
  <div>
    <p className="headline-md ...">{t("landing.pricingFreeTitle")}</p>
    <p className="mt-3 metric ...">{t("landing.pricingFreePrice")}</p>
    <ul className="mt-8 space-y-3.5 ...">
      <li>...</li>
      <li>...</li>
      <li>...</li>
      <li>...</li>
    </ul>
+   <div className="mt-8">
+     <Button href="/register" variant="soft" className="w-full rounded-full">
+       {t("landing.pricingFreeCta")}
+     </Button>
+   </div>
  </div>
</div>
```

**Why `variant="soft"`:** Free card gak perlu primary (kompetisi visual sama Premium). Soft = subtle, gak mencuri perhatian dari Premium card.

### Step 4.3: Add Button to Premium card

```tsx
{/* Premium Plan — line 184-208 area */}
<div className="card relative glass-pricing-card border-2 border-primary/50 ...">
  <span className="absolute -top-3.5 ...">{t("landing.pricingPremiumBadge")}</span>
  <div>
    <p className="headline-md ...">{t("landing.pricingPremiumTitle")}</p>
    <p className="mt-3 metric ...">{t("landing.pricingPremiumPrice")}</p>
    <span className="mt-1 ...">{t("landing.pricingAnnualHighlight")}</span>
    <ul className="mt-8 space-y-3.5 ...">
      <li>...</li>
      <li>...</li>
      <li>...</li>
      <li>...</li>
    </ul>
+   <div className="mt-8">
+     <Button href="/register" className="w-full rounded-full">
+       {t("landing.pricingPremiumCta")}
+     </Button>
+   </div>
  </div>
</div>
```

**Why `variant="primary"` (default):** Premium card is the hero — primary button reinforces visual hierarchy.

**Commit:**
```bash
git add app/[locale]/page.tsx messages/id.json messages/en.json
git commit -m "feat: add CTA buttons to pricing cards"
```

---

## Task 5: Replace FAQ #4

**Objective:** Ganti pertanyaan "Bisa akses dari HP?" yang obvious jadi pertanyaan yang lebih substantive.

**Files:**
- Modify: `messages/id.json` — 2 keys
- Modify: `messages/en.json` — 2 keys

### Step 5.1: Update `messages/id.json`

```diff
-  "faq4Question": "Bisa akses dari HP?",
+  "faq4Question": "Kenapa pakai Balance, bukan aplikasi lain?",

-  "faq4Answer": "Bisa. Balance dirancang responsive untuk desktop dan mobile. Anda juga bisa memasang Balance sebagai aplikasi PWA (Progressive Web App) langsung dari browser HP Anda. Perlu diingat bahwa Balance saat ini belum mendukung mode offline penuh — koneksi internet tetap diperlukan untuk mengakses data.",
+  "faq4Answer": "Balance fokus ke satu hal: bikin keuangan rumah tangga terasa lebih tenang. Tidak ada iklan, tidak ada fitur investasi yang bikin bingung, tidak ada gamifikasi — hanya catatan, anggaran, dan laporan yang rapi. Plus, AI Chat bantu kamu baca kondisi keuangan pakai bahasa sehari-hari, bukan tabel yang bikin pusing.",
```

**Why this question:** Ini sebenernya objection handling — "kenapa gue harus pindah dari app yang udah gue pake?" Jawabannya positioning Balance sebagai anti-complexity. 

### Step 5.2: Update `messages/en.json`

```diff
-  "faq4Question": "Can I access it from my phone?",
+  "faq4Question": "Why Balance over other apps?",

-  "faq4Answer": "Yes. Balance is designed to be responsive on both desktop and mobile. You can also install Balance as a PWA (Progressive Web App) directly from your phone's browser. ...",
+  "faq4Answer": "Balance focuses on one thing: making household finances feel calm. No ads, no confusing investment features, no gamification — just clean records, budgets, and reports. Plus, AI Chat helps you understand your finances in plain language, not confusing tables.",
```

**Commit:**
```bash
git add messages/id.json messages/en.json
git commit -m "copy: replace FAQ #4 with differentiation question"
```

---

## Task 6: Remove "Section" Label from Mobile Nav

**Objective:** Hapus label "Section" yang redundant di tiap mobile nav item.

**Files:**
- Modify: `components/landing/landing-header.tsx` — line 165

### Step 6.1: Delete the label span

```diff
  // landing-header.tsx line 163-166 — inside mobile nav item <a>
  <span>{t(link.key)}</span>
- <span className="font-label text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Section</span>
```

**Commit:**
```bash
git add components/landing/landing-header.tsx
git commit -m "refactor: remove redundant Section label from mobile nav"
```

---

## Task 7: Slow Down Hero Carousel

**Objective:** Turunin autoplay speed dari 4 detik ke 7 detik — less distracting.

**Files:**
- Modify: `components/landing/landing-hero-mockup.tsx` — line 225

### Step 7.1: Change interval constant

```diff
- const SLIDE_INTERVAL_MS = 4000;
+ const SLIDE_INTERVAL_MS = 7000;
```

**Kenapa 7000:** Research landing page carousel best practice: 5-8 detik optimal. 4 detik terlalu cepat — user belum selesai baca hero copy, mockup udah ganti slide.

**Commit:**
```bash
git add components/landing/landing-hero-mockup.tsx
git commit -m "tweak: slow hero carousel to 7s interval"
```

---

## Verification

### Typecheck

```bash
npm run typecheck   # must pass
```

**Expected:** 0 errors. `AppIcon` import di Server Component valid karena AppIcon adalah client component — Server Components boleh render client components.

### Build

```bash
npm run build
```

**Expected:** Build sukses. Cek halaman `/` dan `/en` di output — tidak ada error routing.

### Visual Checklist

```
□ Buka mybalance.my.id (belum login)
  □ Hero headline: "Uangmu jelas." / "Pikiranmu tenang." (dua baris)
  □ Hero description: benefit-focused, singkat
  □ Tombol: "Mulai gratis" + "Masuk"
  □ 3-card section (Ringkas/Fleksibel/Jelas) SUDAH HILANG
  □ Hero mockup carousel tetap jalan
  □ Balance antara text kiri dan mockup kanan OK

□ Scroll ke Features section
  □ 4 feature card punya AppIcon di atas title
  □ Icon cocok sama konten (transactions → arus kas, budgets → anggaran, etc.)
  □ Dark mode: icon tone="primary" adjust otomatis

□ Scroll ke Pricing section
  □ Free card ada tombol "Mulai gratis" (soft)
  □ Premium card ada tombol "Coba Premium" (primary)
  □ Klik tombol → redirect ke /register

□ Scroll ke FAQ section
  □ Pertanyaan #4: "Kenapa pakai Balance, bukan aplikasi lain?"
  □ Jawaban positioning Balance dengan jelas

□ Mobile
  □ Hamburger menu → nav items TIDAK ada label "Section"
  □ Hero dua baris OK di layar kecil

□ Dark mode
  □ Landing page dark mode (beda dari app dark mode) semua OK
  □ Feature icons, pricing cards, CTA readable

□ English (/en)
  □ Semua copy English sesuai
  □ Title: "Your money, clear. / Your mind, calm."
```

---

## File Summary

| # | File | Action | Lines Δ |
|---|------|--------|---------|
| 1 | `messages/id.json` | Modify — hero copy + new keys | ~20 lines |
| 2 | `messages/en.json` | Modify — mirror English | ~20 lines |
| 3 | `app/[locale]/page.tsx` | Modify — hero split title, remove cards, add icons, add pricing CTAs | ~30 lines |
| 4 | `components/landing/landing-header.tsx` | Modify — remove "Section" label | -1 line |
| 5 | `components/landing/landing-hero-mockup.tsx` | Modify — carousel interval | 1 line |

### Yang TIDAK Berubah

| Scope | Kenapa |
|-------|--------|
| Layout grid / flex structure | Risiko regresi — cuma ubah konten, bukan struktur |
| `LandingHeroMockup` slides | 3 slide tetap — dashboard, transactions, dark overview |
| `LandingScrollObserver` | Animasi fade-in tetap jalan |
| `LandingThemeToggle` | Dark mode toggle tetap |
| Pricing card styling | Hanya tambah Button, gak ubah CSS |
| Feature card CSS | Hanya tambah AppIcon, gak ubah grid/layout |
| Steps, Use Cases, CTA footer sections | Copy & layout gak diubah (udah bagus) |
| PWA install prompt | Tetap di hero section |

---

## Open Questions

- **Hero title split approach:** Gue pilih `titleLine1`/`titleLine2` sebagai dua i18n key terpisah. Alternatif: single key dengan `{line1}\n{line2}` + CSS `white-space: pre-line`. Explicit split lebih aman (no CSS dependency, clear intent). **Keputusan final ada di eksekutor.**
- **Feature icon selection:** Gue mapping `[transactions, budgets, settlements, savings]`. Kalau ternyata icon gak match sama copy-nya, bisa di-adjust per card.
- **English QA:** Copy English gue translate manual — perlu native speaker review sebelum production.
