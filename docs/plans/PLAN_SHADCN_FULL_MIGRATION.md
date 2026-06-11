# Rencana Migrasi Penuh ke `shadcn/ui`

> **Status:** Draft — belum ada kode yang diubah.
> **Dasar:** Analisis terhadap `components/ui/` (21 komponen), `docs/plans/PLAN_UPGRADE.md`, `app/globals.css`, `tailwind.config.ts`, `lib/utils.ts`, dan `package.json`.
> **Prinsip:** 100% desain visual "Serene Capital" dipertahankan. shadcn hanya menjadi cangkang struktural baru.

---

## Ringkasan

Migrasi seluruh `components/ui/` dari implementasi kustom ke komponen `shadcn/ui`, dengan tetap mempertahankan seluruh token CSS existing sebagai sumber kebenaran tampilan.

**Target:** 21 komponen existing → ~14 komponen shadcn + 6 komponen dipertahankan + 3 dihapus/diganti.

---

## 1. Dependency Baru

```json
{
  "class-variance-authority": "^0.7.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x",
  "tailwindcss-animate": "^1.x",
  "lucide-react": "^0.x",
  "@radix-ui/react-alert-dialog": "^1.x",
  "@radix-ui/react-collapsible": "^1.x",
  "@radix-ui/react-select": "^1.x",
  "@radix-ui/react-label": "^2.x",
  "@radix-ui/react-slot": "^1.x",
  "@radix-ui/react-radio-group": "^1.x",
  "sonner": "^1.x"
}
```

| Dependency | Alasan |
|---|---|
| `class-variance-authority` | Sistem varian komponen (Button, Badge, dll.) |
| `clsx` + `tailwind-merge` | Utilitas `cn` yang dipakai seluruh shadcn |
| `tailwindcss-animate` | Plugin Tailwind untuk animasi shadcn |
| `lucide-react` | Ikon yang dipakai komponen shadcn |
| `@radix-ui/react-alert-dialog` | Pengganti `ConfirmDialog` kustom |
| `@radix-ui/react-collapsible` | Pengganti `InlineEditPanel` |
| `@radix-ui/react-select` | Pengganti `<select>` native di `CategorySelect` |
| `@radix-ui/react-label` | Dipakai shadcn Form/Select |
| `@radix-ui/react-slot` | Dipakai shadcn Button (`asChild`) |
| `@radix-ui/react-radio-group` | Pengganti `ColorPalette` kustom |
| `sonner` | Pengganti `ToastProvider` + `ToastFeedback` kustom |

> **Catatan:** `@radix-ui/react-dialog` sudah ada di `package.json`. Tidak perlu ditambah lagi.

---

## 2. Strategi Token CSS — Paling Kritis

### Situasi

shadcn/ui secara default menggunakan variabel CSS sendiri (`--background`, `--foreground`, `--primary`, dll.) yang akan **bertabrakan** dengan token Serene Capital yang sudah ada di `app/globals.css`.

### Solusi: Namespace `--sh-*` dengan Alias

Token Serene Capital tetap sebagai **single source of truth**. Token shadcn dibuat sebagai alias yang membaca dari token existing:

```css
:root {
  /* --- Token Serene Capital (TIDAK DISENTUH) --- */
  --background: #fbf9f3;
  --foreground: #1b1c18;
  --primary: #595f3d;
  /* ... dst ... */

  /* --- Alias shadcn/ui (membaca dari token di atas) --- */
  --sh-background: var(--background);
  --sh-foreground: var(--foreground);
  --sh-card: var(--card);
  --sh-card-foreground: var(--foreground);
  --sh-popover: var(--card-elevated);
  --sh-popover-foreground: var(--foreground);
  --sh-primary: var(--primary);
  --sh-primary-foreground: var(--button-primary-text, #ffffff);
  --sh-secondary: var(--muted);
  --sh-secondary-foreground: var(--muted-foreground);
  --sh-muted: var(--muted);
  --sh-muted-foreground: var(--muted-foreground);
  --sh-accent: var(--accent);
  --sh-accent-foreground: var(--accent-foreground);
  --sh-destructive: var(--danger);
  --sh-destructive-foreground: #ffffff;
  --sh-border: var(--border);
  --sh-input: var(--surface);
  --sh-ring: rgba(89, 95, 61, 0.30);
  --sh-radius: 0.5rem;
}

[data-theme="dark"] {
  /* Alias shadcn untuk dark mode */
  --sh-background: var(--background);
  --sh-foreground: var(--foreground);
  --sh-card: var(--card);
  --sh-card-foreground: var(--foreground);
  --sh-primary: var(--primary);
  --sh-primary-foreground: var(--button-primary-text, #1b1c18);
  --sh-secondary: var(--muted);
  --sh-secondary-foreground: var(--muted-foreground);
  --sh-muted: var(--muted);
  --sh-muted-foreground: var(--muted-foreground);
  --sh-accent: var(--accent);
  --sh-accent-foreground: var(--accent-foreground);
  --sh-destructive: var(--danger);
  --sh-destructive-foreground: #ffffff;
  --sh-border: var(--border);
  --sh-input: var(--surface);
  --sh-ring: rgba(195, 202, 161, 0.30);
}
```

### Konfigurasi `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": "sh-"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui/shadcn",
    "lib": "@/lib"
  }
}
```

### Update `tailwind.config.ts`

```ts
plugins: [
  require("tailwindcss-animate"),
],
// + warna alias shadcn:
shBackground: "var(--sh-background)",
shForeground: "var(--sh-foreground)",
shCard: "var(--sh-card)",
shCardForeground: "var(--sh-card-foreground)",
// ... dst
```

> **Prinsip:** Token Serene Capital tidak disentuh. Semua class utility existing (`.card`, `.headline-md`, `.eyebrow`, `bg-primary`, `text-muted-foreground`, dll.) tetap berfungsi seperti sebelumnya.

---

## 3. Pemetaan Komponen

### 3A. Komponen yang Diganti Penuh (14)

| # | Existing | shadcn/ui | Base | Catatan |
|---|---|---|---|---|
| 1 | `button.tsx` | `Button` | `Slot` | Varian lebih kaya; `asChild` untuk komposisi Link |
| 2 | `badge.tsx` | `Badge` | — | Struktur mirip; tone sukses/danger dipertahankan via styling |
| 3 | `dialog.tsx` | `Dialog` | `react-dialog` (existing) | API nama identik; shadcn lebih terstruktur |
| 4 | `sheet.tsx` | `Sheet` | `react-dialog` (existing) | Sudah mirip; shadcn lebih lengkap |
| 5 | `table.tsx` | `Table` | — | shadcn Table lebih matang |
| 6 | `confirm-dialog.tsx` | `AlertDialog` | `react-alert-dialog` | Komponen khusus untuk konfirmasi |
| 7 | `notice.tsx` | `Alert` | — | shadcn Alert dengan varian tone |
| 8 | `toast-provider.tsx` | `Sonner` | — | Lebih matang: animasi, swipe dismiss, positioning |
| 9 | `toast-feedback.tsx` | `Sonner` | — | Digabung ke Sonner |
| 10 | `color-palette.tsx` | `RadioGroup` | `react-radio-group` | Radio button accessible |
| 11 | `category-select.tsx` | `Select` | `react-select` | Select Radix lebih accessible |
| 12 | `inline-edit-panel.tsx` | `Collapsible` | `react-collapsible` | Animasi expand/collapse |
| 13 | `currency-input.tsx` | `Input` | — | shadcn Input sbg basis; format Rupiah tetap |
| 14 | `submit-button.tsx` | `Button` | — | Varian + pending state via `useFormStatus` |

### 3B. Komponen yang Dipertahankan (6)

| # | Komponen | Alasan |
|---|---|---|
| 1 | `app-icon.tsx` | Ikon kustom aplikasi; tidak ada padanan shadcn |
| 2 | `action-form.tsx` | Logika bisnis spesifik: `useActionState` + toast + refresh |
| 3 | `route-transition.tsx` | Efek transisi route kustom, murni dekoratif |
| 4 | `page-loading-skeleton.tsx` | Skeleton layout kompleks. Bisa refactor internal nanti |
| 5 | `empty-state.tsx` | Tidak ada padanan shadcn; komponen kecil |
| 6 | `stat-card.tsx` | Bisa dibungkus ulang pakai shadcn `Card` secara internal |

### 3C. Yang Dihapus (3)

| # | Komponen | Diganti Oleh |
|---|---|---|
| 1 | `confirm-dialog.tsx` | `AlertDialog` (shadcn) |
| 2 | `toast-provider.tsx` | `Sonner` (shadcn) |
| 3 | `toast-feedback.tsx` | `Sonner` (shadcn) |

> Komponen dihapus **setelah** semua consumer bermigrasi ke API baru. File lama disimpan sebagai fallback dulu.

---

## 4. Strategi Varian Button

Button adalah komponen paling banyak dipakai (20+ file). Ini area risiko tertinggi.

### Varian Existing → shadcn

| Existing | shadcn | CSS Mapping |
|---|---|---|
| `variant="primary"` | `variant="default"` | `bg-primary text-white shadow-serene` |
| `variant="ghost"` | `variant="outline"` | `border border-border bg-transparent text-foreground` |
| `variant="soft"` | `variant="secondary"` | `bg-primary-soft text-primary-strong` |

### Pendekatan

1. **Wrapper di `components/ui/button.tsx`** mempertahankan API existing:
   ```ts
   type ButtonProps = {
     children: ReactNode;
     variant?: "primary" | "ghost" | "soft";  // mapping ke shadcn
     href?: string;                            // auto-localize i18n
     size?: "sm" | "md";
     // ... semua props existing
   };
   ```
2. Tambahkan varian `soft` ke shadcn Button via `cva` custom
3. Internal wrapper handle `href` → Link + `useLocale()` untuk path localization
4. **Semua consumer tidak perlu diubah** — import path tetap `@/components/ui/button`

---

## 5. Migrasi `cn` Utility

### Saat ini (`lib/utils.ts`)

```ts
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
```

### Target

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Dampak

- **Positif:** Tidak ada konflik kelas Tailwind (`px-4` vs `px-2`). `twMerge` menangani prioritas secara otomatis.
- **Risiko:** Beberapa komponen mungkin mengandalkan urutan kelas di string. Perlu QA visual setelah migrasi.

---

## 6. Output Direktori

Agar migrasi bertahap aman, komponen shadcn di-generate ke sub-folder terpisah:

```
components/
  ui/
    shadcn/          <-- komponen hasil generate shadcn
      button.tsx
      badge.tsx
      dialog.tsx
      sheet.tsx
      table.tsx
      alert-dialog.tsx
      alert.tsx
      collapsible.tsx
      radio-group.tsx
      select.tsx
      input.tsx
      label.tsx
      sonner.tsx
      skeleton.tsx     (opsional)
      card.tsx         (opsional)
    button.tsx         <-- re-export dari shadcn + wrapper kustom
    badge.tsx          <-- re-export
    dialog.tsx         <-- re-export
    sheet.tsx          <-- re-export
    table.tsx          <-- re-export
    ...                <-- komponen dipertahankan tetap di sini
```

Dengan pendekatan ini, `components.json` aliases `"ui": "@/components/ui/shadcn"`. File `components/ui/button.tsx` (dan lainnya) menjadi re-export sederhana + wrapper kustom. Consumer tidak perlu mengubah import path.

---

## 7. Fase Migrasi (9–12 hari)

### Fase 0: Fondasi (1–2 hari)

1. `npm install` semua dependency baru
2. Inisialisasi shadcn: `npx shadcn@latest init`
   - Style: `default`
   - CSS Variables: No (kita handle manual via `--sh-*`)
   - Output dir: `components/ui/shadcn/`
   - Prefix: `sh-`
3. Setup token alias `--sh-*` di `app/globals.css`
4. Update `tailwind.config.ts`:
   - Plugin `tailwindcss-animate`
   - Warna alias shadcn (`sh-background`, `sh-foreground`, dll.)
5. Update `cn` utility ke `clsx` + `twMerge`
6. **Verifikasi:** `npm run typecheck && npm run test && npm run build`

**Risk stop point:** Jika build/typecheck gagal, rollback aman karena belum ada komponen yang berubah.

---

### Fase 1: Komponen Tanpa Consumer Langsung (1 hari)

Generate komponen shadcn yang **belum dipakai langsung** oleh consumer:

```bash
npx shadcn@latest add alert-dialog
npx shadcn@latest add alert
npx shadcn@latest add collapsible
npx shadcn@latest add radio-group
npx shadcn@latest add select
npx shadcn@latest add sonner
```

Semua masuk ke `components/ui/shadcn/`. Belum ada perubahan di komponen existing. Consumer belum terpengaruh.

---

### Fase 2: Primitive Low-Risk (1–2 hari)

Migrasi komponen dengan API yang paling mirip:

| Komponen | API Match | Strategi |
|---|---|---|
| `badge.tsx` | Hampir identik | Export ulang dari shadcn + tone mapping |
| `table.tsx` | Sama persis (`Table`, `TableHeader`, `TableBody`, dll.) | Export ulang langsung |
| `dialog.tsx` | Nama sama | Export ulang + tambah `DialogClose` |
| `sheet.tsx` | Nama mirip | Export ulang + sesuaikan export |

Pendekatan: File existing menjadi re-export sederhana dari `shadcn/`. Consumer tidak perlu mengubah import path.

---

### Fase 3: Button & Turunannya (2–3 hari) — PALING KRITIS

1. **`button.tsx`**: Re-export shadcn + wrapper kustom untuk:
   - Varian `primary` / `ghost` / `soft` → mapping ke shadcn
   - `href` → auto-localize dengan `useLocale()`
   - Ukuran dan properti existing
2. **`submit-button.tsx`**: Refactor internal pakai shadcn Button + `useFormStatus`
3. **`confirm-submit-button.tsx`**: Refactor internal pakai shadcn Button + `AlertDialog`
4. **`confirm-dialog.tsx`**: Ubah jadi re-export `AlertDialog`

**Consumer terdampak (20+ file):**
- `app-shell.tsx`, semua feature pages (dashboard, transactions, budgets, savings, recurring, wallets, categories, settings, chat, changelogs)
- `pwa/install-prompt.tsx`, halaman auth (login, register, invite)
- Halaman offline, error

**Mitigasi:** Wrapper mempertahankan API 100% identik. TypeScript `strict` menjamin tidak ada breaking change yang lolos.

---

### Fase 4: Form Components (2 hari)

1. **`currency-input.tsx`**: Wrap shadcn `Input` + formatting logic Rupiah tetap
2. **`category-select.tsx`**: Ganti `<select>` internal dengan shadcn `Select` + icon kategori tetap
3. **`color-palette.tsx`**: Ganti radio buttons internal dengan shadcn `RadioGroup`
4. **`notice.tsx`**: Re-export shadcn `Alert`
5. **`inline-edit-panel.tsx`**: Ganti internal dengan shadcn `Collapsible`
6. **`toast-provider.tsx` + `toast-feedback.tsx`**: Migrasi ke `Sonner`

**Detail Toast Migration:**
- `useToast()` API dipertahankan sebagai wrapper Sonner
- `pushToast({ tone: "success", description: "..." })` → `toast.success(description)`
- `ToastProvider` → `<Toaster>` dari Sonner di `app/layout.tsx`
- `action-form.tsx` tetap pakai `useToast()` hook tanpa perubahan

---

### Fase 5: Polish & QA (2 hari)

1. **Opsional:** `stat-card.tsx` bungkus ulang pakai shadcn `Card`
2. **Opsional:** `page-loading-skeleton.tsx` bungkus ulang pakai shadcn `Skeleton`
3. **Tetap:** `app-icon.tsx`, `empty-state.tsx`, `route-transition.tsx`, `action-form.tsx`

QA menyeluruh:

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run test` — semua test pass
- [ ] `npm run build` — build sukses
- [ ] Light mode: semua halaman render benar
- [ ] Dark mode: semua halaman render benar
- [ ] Mobile: semua interaksi (form, dialog, sheet, toast) berfungsi
- [ ] Desktop: semua interaksi berfungsi
- [ ] Button `primary` / `ghost` / `soft` — tampil sesuai desain
- [ ] Button `href` — auto-localize path i18n
- [ ] `ActionForm`, `SubmitButton`, `ConfirmSubmitButton` — masih berfungsi
- [ ] `CurrencyInput` — format Rupiah benar
- [ ] `CategorySelect` — ikon kategori masih tampil
- [ ] Toast muncul di create/edit/delete sukses & error
- [ ] Sheet, Dialog, AlertDialog — keyboard Escape, focus trap
- [ ] Warna, font, spacing, shadow — identik sebelum migrasi
- [ ] Tidak ada flicker / layout shift saat mount

---

## 8. Ringkasan Perubahan File

### File Baru

| File | Isi |
|---|---|
| `components.json` | Konfigurasi shadcn/ui |
| `components/ui/shadcn/*.tsx` | ~14 komponen hasil generate shadcn |

### File Dimodifikasi

| File | Perubahan |
|---|---|
| `package.json` | +11 dependency baru |
| `app/globals.css` | +blok alias token `--sh-*` (light + dark) |
| `tailwind.config.ts` | +plugin `tailwindcss-animate`, +warna alias shadcn |
| `lib/utils.ts` | `cn()` → `clsx` + `twMerge` |
| `components/ui/button.tsx` | Re-export + wrapper kustom |
| `components/ui/badge.tsx` | Re-export shadcn |
| `components/ui/dialog.tsx` | Re-export shadcn |
| `components/ui/sheet.tsx` | Re-export shadcn |
| `components/ui/table.tsx` | Re-export shadcn |
| `components/ui/confirm-dialog.tsx` | Re-export `AlertDialog` |
| `components/ui/notice.tsx` | Re-export `Alert` |
| `components/ui/submit-button.tsx` | Internal refactor |
| `components/ui/confirm-submit-button.tsx` | Internal refactor |
| `components/ui/currency-input.tsx` | Internal refactor |
| `components/ui/category-select.tsx` | Internal refactor |
| `components/ui/color-palette.tsx` | Internal refactor |
| `components/ui/inline-edit-panel.tsx` | Internal refactor |
| `components/ui/toast-provider.tsx` | Wrapper Sonner |
| `components/ui/toast-feedback.tsx` | Wrapper Sonner |
| `app/layout.tsx` | `<ToastProvider>` → `<Toaster>` |
| `components/ui/stat-card.tsx` | Opsional internal refactor |
| `components/ui/page-loading-skeleton.tsx` | Opsional internal refactor |

### File Tidak Disentuh Sama Sekali

- `components/ui/app-icon.tsx`
- `components/ui/action-form.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/route-transition.tsx`
- Semua `components/features/*.tsx` — tidak perlu ubah import
- Semua `app/**/page.tsx` — tidak perlu ubah import
- Semua `lib/data/*`, `lib/supabase/*`, `app/actions/*` — tidak tersentuh

---

## 9. Risiko & Mitigasi

| Risiko | Level | Mitigasi |
|---|---|---|
| Token CSS bentrok | 🔴 High | Namespace `--sh-*` sebagai alias; token asli tidak disentuh |
| `cn` baru rusak conditional class | 🟡 Medium | `twMerge` sudah mature di ekosistem; QA per halaman |
| Button consumer break (20+ file) | 🟡 Medium | Wrapper pertahankan API identik; typecheck tangkap mismatch |
| Sonner toast beda perilaku | 🟡 Medium | Wrapper `useToast()` pertahankan API; test semua aksi |
| shadcn Select lebih kompleks dari `<select>` | 🟢 Low | `CategorySelect` API publik tidak berubah |
| Dark mode shadcn default beda selector | 🟢 Low | Dark mode sudah pakai `[data-theme="dark"]` — cocok dengan shadcn |
| Bundle size membesar | 🟢 Low | Tree-shaken; Radix sudah ada partial; Sonner kecil (~3KB) |
| `lucide-react` ikon tidak cocok estetika | 🟢 Low | Hanya dipakai internal komponen shadcn; `AppIcon` tetap |

---

## 10. Dampak i18n (Internasionalisasi)

### Prinsip: Zero Breaking Change

Semua komponen yang terdampak i18n **dipertahankan API publiknya**. Tidak ada perubahan pada:
- `LocaleProvider` & `useLocale()` — mekanisme inject locale tetap
- `getTranslator()` — fungsi get message dictionary tetap
- `localizePath()` — fungsi path localization tetap
- `messages/*.json` — message dictionary tidak berubah

---

### Titik Kontak i18n per Komponen

#### 1. `Button` — KRITIS ✅ Auto-localize href

Terverifikasi di `components/ui/button.tsx` baris 4-5, 27, 37:

```ts
import { useLocale } from "@/components/providers/locale-provider";
import { localizePath } from "@/lib/i18n";

const locale = useLocale();
// ...
<Link href={localizePath(locale, href)}>  // "/dashboard" → "/id/dashboard"
```

**Strategi (Fase 3):** Wrapper `components/ui/button.tsx` tetap seperti sekarang:
- Menerima `href` → auto-localize via `useLocale()` + `localizePath()`
- Varian `primary`/`ghost`/`soft` tetap sebagai props consumer
- Internal mapping ke shadcn variant (`default`/`outline`/`secondary`)
- Semua consumer (20+ file) **tidak perlu diubah**

#### 2. `InlineEditPanel` → `Collapsible` — AMAN ✅ Fallback translation tetap

Terverifikasi di `components/ui/inline-edit-panel.tsx` baris 25-31:

```ts
const locale = useLocale();
const t = getTranslator(locale);
const resolvedButtonLabel = buttonLabel ?? t("common.editData");        // "Edit Data"
const resolvedDescription = description ?? t("common.inlineEditDescription");
const resolvedTitle = title ?? t("common.editable");
```

**Strategi (Fase 4):** Refactor internal ke shadcn `Collapsible`, tapi:
- Props `buttonLabel`, `description`, `title` tetap sebagai override opsional
- Default fallback ke `getTranslator(locale)` tetap
- Label tombol buka/tutup (`t("common.closeEditor")`) tetap
- Consumer yang kirim explicit label tidak terpengaruh

#### 3. `EmptyState` — TIDAK DIMIGRASI ✅ Aman

```ts
const t = getTranslator(locale);
<p>{t("emptyState.eyebrow")}</p>
```

Komponen ini **tidak disinggung** di plan. Tidak ada risiko.

#### 4. `ActionForm` — TIDAK DIMIGRASI ✅ Aman

- Tidak menggunakan `useLocale`/`getTranslator` secara langsung
- Pesan toast berasal dari server action (Bahasa Indonesia from server)
- `useToast()` akan di-wrap ke Sonner, API identik

#### 5. `PageLoadingSkeleton` — TIDAK DIMIGRASI ✅ Aman

Pakai `getTranslator` untuk teks skeleton. Tidak disentuh.

#### 6. Semua Komponen di `components/features/` dan `app/` — AMAN ✅

Feature components dan page components menggunakan i18n langsung dari:
```ts
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";
```

Karena **import path tidak berubah** (`@/components/ui/button` tetap ada), semua consumer tetap berfungsi seperti sebelumnya. Tidak ada perubahan routing, locale detection, atau message structure.

---

### Ringkasan Matriks i18n

| Komponen | Pakai i18n? | Strategi Migrasi | Risiko |
|---|---|---|---|
| `Button` | ✅ `localizePath(href)` | Wrapper pertahankan API | 🟢 Tidak ada — wrapper explicit |
| `InlineEditPanel` → `Collapsible` | ✅ `getTranslator` fallback | Internal refactor, fallback tetap | 🟢 Tidak ada — label explicit tetap prioritas |
| `EmptyState` | ✅ `getTranslator` | Tidak dimigrasi | 🟢 Tidak ada |
| `ActionForm` | ❌ (consuming toast) | Tidak dimigrasi | 🟢 Tidak ada |
| `PageLoadingSkeleton` | ✅ `getTranslator` | Tidak dimigrasi | 🟢 Tidak ada |
| `StatCard` | ❌ | Opsional internal refactor | 🟢 Tidak ada |
| Semua feature/page components | ✅ `useLocale()` + `getTranslator()` langsung | Import path tidak berubah | 🟢 Tidak ada |

---

## 11. Hal yang **TIDAK** Berubah

- **Desain visual 100%** — warna cream/sage/forest, tipografi Hanken Grotesk/Inter/Geist, spacing 8px, border-radius, shadow
- **Light mode & dark mode** — keduanya tetap first-class; token berasal dari `app/globals.css` yang sama
- **Server actions & form flow** — `ActionForm`, `useActionState`, redirect, revalidation
- **Cache invalidation** — `invalidateWalletReadCaches`, `revalidateWalletPaths`
- **Format Rupiah** — `formatCurrency` tetap
- **Bahasa Indonesia** — semua user-facing text tetap
- **Semua halaman di luar `components/ui/`** — tidak ada perubahan import yang kasat mata

---

## 12. Estimasi Waktu

| Fase | Estimasi | Dependensi |
|---|---|---|
| Fase 0: Fondasi | 1–2 hari | — |
| Fase 1: Komponen tanpa consumer | 1 hari | Fase 0 |
| Fase 2: Primitive low-risk | 1–2 hari | Fase 0 |
| Fase 3: Button & turunan | 2–3 hari | Fase 0, 2 |
| Fase 4: Form components | 2 hari | Fase 0, 2 |
| Fase 5: Polish & QA | 2 hari | Semua fase |
| **Total** | **9–12 hari** | |

---

## 13. Rekomendasi Eksekusi

1. **Mulai dari Fase 0–1**, lalu pause dan evaluasi. Ini titik aman untuk rollback — hanya dependency + token, belum ada komponen berubah.
2. **Jangan paralel dengan fitur baru** — migrasi ini menyentuh 20+ file consumer.
3. **Buat git tag** (`git tag pre-shadcn`) sebelum mulai sebagai backup instant.
4. **Pertahankan file existing** di `components/ui/` sampai semua consumer diverifikasi. Hanya hapus setelah Fase 5 selesai dan QA lolos.
5. **Prioritaskan Button di Fase 3** — ini komponen paling kritis karena dipakai di mana-mana.
6. **Libatkan QA manual** untuk tiap fase, bukan hanya di akhir.
