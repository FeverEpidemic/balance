# Plan: Landing Footer yang Lebih Bernyawa

**Branch:** `feat/richer-landing-footer`
**Created:** 2025-06-24
**Scope:** Komponen footer landing page saja (tidak menyentuh halaman authenticated)

---

## Before → After

### Before (hanya 3 link legal, 22 baris)

```tsx
// app/[locale]/page.tsx L375-397
<footer className="mt-12 border-t border-border pt-6 text-center sm:pt-8">
  <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 sm:gap-x-6 sm:gap-y-3">
    <Link href={localizePath(locale, "/privacy")}>
      {t("common.privacy")}
    </Link>
    <Link href={localizePath(locale, "/terms")}>
      {t("common.terms")}
    </Link>
    <Link href={localizePath(locale, "/refund-policy")}>
      {t("common.refundPolicy")}
    </Link>
  </div>
</footer>
```

### After (4-column rich footer, ~140 baris komponen terpisah)

```
┌──────────────────────────────────────────────────────────────────┐
│  (border-t subtle divider)                                       │
│                                                                  │
│  ┌──────────┬──────────────┬──────────────┬───────────────────┐  │
│  │  BRAND   │  NAVIGASI    │  KONTAK &    │  TRUST            │  │
│  │          │              │  SOSMED      │                   │  │
│  │ [Logo]   │  • Fitur     │              │  🔒 Data          │  │
│  │ Balance  │  • Cara Kerja│  ✉ support@.  │     terenkripsi   │  │
│  │ Keuangan │  • Harga     │              │                   │  │
│  │ yg lebih │  • Privasi   │  [IG]  [Th]  │  🇮🇩 Made in      │  │
│  │ tenang   │  • Ketentuan │  @mybalance  │     Indonesia     │  │
│  │          │              │              │                   │  │
│  └──────────┴──────────────┴──────────────┴───────────────────┘  │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│  © 2025 Balance · Hak cipta dilindungi                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Files Changed

### 1. NEW: `components/landing/landing-footer.tsx`

Komponen client-side (`"use client"`) karena pakai `useLocale()` + `getTranslator()`.

**Imports:**
```tsx
import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { Logo } from "@/components/brand/logo";
import { getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";
```

**Struktur komponen:**
- `LandingFooter()` — main export, server-compatible client component
- 4 kolom: Brand, Navigasi, Kontak & Sosmed, Trust
- Bottom bar: Copyright

**Detail per kolom:**

**Kolom 1 — Brand:**
- `<Logo variant="icon" className="h-10 w-10" />` (icon aja, bukan wordmark — lebih compact)
- Teks "Balance" (`app.name`) pakai `headline-md`
- Tagline (`app.tagline`) pakai `text-sm text-muted-foreground`

**Kolom 2 — Navigasi:**
- Anchor links: `#features`, `#how-it-works`, `#pricing`
- Page links: `/privacy`, `/terms`
- Semua pakai `text-sm text-muted-foreground hover:text-foreground transition-colors`
- Heading kolom: `font-label text-xs uppercase tracking-[0.12em] text-muted-foreground`

**Kolom 3 — Kontak & Sosmed:**
- Email: `support@mybalance.my.id` dengan `mailto:` link
- Instagram: `@mybalance.my.id` → link ke `https://instagram.com/mybalance.my.id`
- Threads: `@mybalance.my.id` → link ke `https://threads.net/@mybalance.my.id`
- Semantic SVG icons atau lucide-react untuk IG/Threads
- Note: lucide-react tidak punya icon Instagram/Threads — pakai inline SVG sederhana

**Kolom 4 — Trust:**
- Badge "🔒 Data terenkripsi" — pill style, `bg-primary-soft text-primary-strong`
- Badge "🇮🇩 Made in Indonesia" — pill style

**Bottom bar:**
- `© {new Date().getFullYear()} Balance · Hak cipta dilindungi`
- `text-xs text-muted-foreground`

**Styling (Serene Capital + "lebih bernyawa"):**
- Background: subtle gradient `bg-gradient-to-b from-transparent via-primary-soft/5 to-primary-soft/10`
- Top border: `border-t border-border/40`
- Social icon hover: `hover:text-primary transition-colors`
- Badge-style trust elements: rounded-full pill
- Mobile: semua kolom stack vertical, gap generous (gap-8)

### 2. EDIT: `app/[locale]/page.tsx` (L375-397)

**Before (L375-397):**
```tsx
        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6 text-center sm:pt-8">
          <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 sm:gap-x-6 sm:gap-y-3">
            <Link
              href={localizePath(locale, "/privacy")}
              className="inline-flex text-sm text-muted-foreground transition hover:text-foreground"
            >
              {t("common.privacy")}
            </Link>
            <Link
              href={localizePath(locale, "/terms")}
              className="inline-flex text-sm text-muted-foreground transition hover:text-foreground"
            >
              {t("common.terms")}
            </Link>
            <Link
              href={localizePath(locale, "/refund-policy")}
              className="inline-flex text-sm text-muted-foreground transition hover:text-foreground"
            >
              {t("common.refundPolicy")}
            </Link>
          </div>
        </footer>
```

**After:**
```tsx
        {/* Footer */}
        <LandingFooter />
```

**Import yang ditambah di page.tsx (L9 area):**
```tsx
import { LandingFooter } from "@/components/landing/landing-footer";
```

Import `Link` dari `next/link` dan `localizePath` dari `@/lib/i18n` di page.tsx bisa dihapus kalau sudah tidak dipakai di file itu — tapi cek dulu apakah masih dipakai di tempat lain di file yang sama.

- `Link` — masih dipakai di banyak tempat (CTA button, dll) → **KEEP**
- `localizePath` — hanya dipakai di footer → **REMOVE** (L4: `import { localizePath, resolveLocale, getTranslator } from "@/lib/i18n";`)

### 3. EDIT: `messages/id.json` (L972)

Tambahkan 7 keys baru sebelum `}` penutup section landing (L973):

```json
    "footerNavTitle": "Navigasi",
    "footerContactTitle": "Kontak",
    "footerTrustTitle": "Kepercayaan",
    "footerEncrypted": "Data terenkripsi",
    "footerMadeIn": "Made in Indonesia",
    "footerCopyright": "© {year} Balance · Hak cipta dilindungi",
    "footerSocialLabel": "{platform}: {handle}"
```

### 4. EDIT: `messages/en.json` (L972)

Tambahkan 7 keys baru:

```json
    "footerNavTitle": "Navigation",
    "footerContactTitle": "Contact",
    "footerTrustTitle": "Trust",
    "footerEncrypted": "Data encrypted",
    "footerMadeIn": "Made in Indonesia",
    "footerCopyright": "© {year} Balance · All rights reserved",
    "footerSocialLabel": "{platform}: {handle}"
```

---

## ASCII Layout Diagram

```
DESKTOP (lg+): 4 kolom equal width
┌──────────────────────────────────────────────────────────────────┐
│ gradient bg: from-transparent via-primary-soft/5 to-primary-soft/10 │
│                                                                  │
│  ┌───────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │   BRAND   │ │  NAVIGASI  │ │   KONTAK &  │ │    TRUST     │  │
│  │           │ │            │ │   SOSMED    │ │              │  │
│  │  [icon]   │ │ Fitur      │ │             │ │ 🔒 Data      │  │
│  │  Balance  │ │ Cara Kerja │ │ ✉ email     │ │  terenkripsi │  │
│  │  tagline  │ │ Harga      │ │             │ │              │  │
│  │           │ │ Privasi    │ │ [IG] [Th]   │ │ 🇮🇩 Made in  │  │
│  │           │ │ Ketentuan  │ │ @mybalance  │ │  Indonesia   │  │
│  └───────────┘ └────────────┘ └─────────────┘ └──────────────┘  │
│                                                                  │
│  ───────────────────── border-t ─────────────────────────────── │
│  © 2025 Balance · Hak cipta dilindungi        (text-center)      │
└──────────────────────────────────────────────────────────────────┘

MOBILE (< lg): semua kolom stacking vertical
┌──────────────────────────┐
│       BRAND              │
│                          │
│      NAVIGASI            │
│                          │
│   KONTAK & SOSMED        │
│                          │
│       TRUST              │
│                          │
│  ─────── border-t ───── │
│  © 2025 Balance ...      │
└──────────────────────────┘
```

---

## Translation Keys Matrix

| Key | ID | EN |
|-----|----|----|
| `landing.footerNavTitle` | "Navigasi" | "Navigation" |
| `landing.footerContactTitle` | "Kontak" | "Contact" |
| `landing.footerTrustTitle` | "Kepercayaan" | "Trust" |
| `landing.footerEncrypted` | "Data terenkripsi" | "Data encrypted" |
| `landing.footerMadeIn` | "Made in Indonesia" | "Made in Indonesia" |
| `landing.footerCopyright` | "© {year} Balance · Hak cipta dilindungi" | "© {year} Balance · All rights reserved" |
| `landing.footerSocialLabel` | "{platform}: {handle}" | "{platform}: {handle}" |

---

## Dependency & Import Check

| Import | Source | Status |
|--------|--------|--------|
| `useLocale` | `@/components/providers/locale-provider` | ✅ Already used in landing-header.tsx |
| `getTranslator` | `@/lib/i18n` | ✅ Already used in landing-header.tsx |
| `localizePath` | `@/lib/i18n` | ✅ Already imported in page.tsx (will be removed from page.tsx, kept in footer) |
| `Logo` | `@/components/brand/logo` | ✅ Already used in landing-header.tsx |
| `cn` | `@/lib/utils` | ✅ Standard utility |
| `Link` | `next/link` | ✅ Standard Next.js |

---

## Design Token Usage

Semua warna pakai semantic Tailwind tokens (bukan hardcoded):
- `bg-primary-soft` — untuk pill badge (trust section)
- `text-primary-strong` — untuk ikon dan hover state
- `text-muted-foreground` — untuk teks sekunder
- `text-foreground` — untuk teks utama
- `border-border/40` — untuk divider (lebih subtle)
- `hover:text-foreground` — untuk hover state link
- `bg-gradient-to-b from-transparent via-primary-soft/5 to-primary-soft/10` — subtle warmth background

---

## Verification Steps

1. `npm run typecheck` — pastikan tidak ada type error
2. `npm run build` — pastikan build sukses (Turbopack)
3. Visual check: buka landing page di dev server, cek light + dark mode
4. Cek mobile responsive (viewport < 1024px)
5. Cek semua link navigasi: anchor links (#features, #how-it-works, #pricing), page links (/privacy, /terms)
6. Cek social links mengarah ke instagram.com dan threads.net yang benar
7. Cek mailto link membuka email client

---

## Rollback Plan

Kalau ada masalah, revert:
```bash
git checkout -- app/\[locale\]/page.tsx messages/id.json messages/en.json
rm components/landing/landing-footer.tsx
```
