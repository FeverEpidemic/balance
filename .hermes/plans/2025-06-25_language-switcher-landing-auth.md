# Language Switcher — Landing & Auth Pages

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Tambah tombol switch bahasa (Indonesia ↔ English) di header landing page dan auth pages (login/register).

**Architecture:** Komponen client `LandingLocaleSwitcher` dengan globe icon + dropdown, di-render di `LandingHeader` (landing) dan di-inline di auth pages. Dropdown pake `useState` + click-outside detection — tanpa dependency baru. Navigasi via `next/navigation` `useRouter` dengan `localizePath`.

**Tech Stack:** React, TypeScript, Tailwind, lucide-react (Globe icon), next/navigation

---

## Sebelum (current)

```
┌──────────────────────────────────────────────────┐
│  [Logo]   Features  How it works  Pricing        │
│                              [☀️] [Login] [Sign up]│  ← ga ada language switcher
└──────────────────────────────────────────────────┘

Auth pages (login/register):
┌──────────────────────────────────────────────────┐
│                                                  │  ← ga ada header / switcher sama sekali
│              Login / Register form               │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Sesudah (target)

```
┌──────────────────────────────────────────────────────┐
│  [Logo]   Features  How it works  Pricing            │
│                              [🌐] [☀️] [Login] [Sign up]│  ← globe icon added
│                                    │                   │
│                              ┌─────┴─────┐             │
│                              │ B.Indo  ✓ │             │  ← dropdown
│                              │ English   │             │
│                              └───────────┘             │
└──────────────────────────────────────────────────────┘

Auth pages (login/register):
┌──────────────────────────────────────────────────────┐
│                                         [🌐]          │  ← globe di pojok kanan atas
│                                                  │
│              Login / Register form               │
│                                                  │
└──────────────────────────────────────────────────────┘
```

---

## Task 1: Bikin komponen `LandingLocaleSwitcher`

**Objective:** Bikin komponen client dengan globe icon + dropdown dua bahasa.

**Files:**
- Create: `/home/ilham827/balance-code/components/landing/landing-locale-switcher.tsx`

### Step 1: Tulis komponen

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator, localizePath, type AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const localeOptions: { locale: AppLocale; labelKey: string }[] = [
  { locale: "id", labelKey: "settings.languageIdLabel" },
  { locale: "en", labelKey: "settings.languageEnLabel" }
];

export function LandingLocaleSwitcher({ className }: { className?: string }) {
  const currentLocale = useLocale();
  const t = getTranslator(currentLocale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    // Close on Escape
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function switchTo(locale: AppLocale) {
    if (locale === currentLocale) {
      setOpen(false);
      return;
    }

    // Preserve hash/anchor
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const targetPath = localizePath(locale, "/") + hash;

    setOpen(false);
    router.push(targetPath);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("settings.languageTitle")}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-[color:var(--primary-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]"
        )}
      >
        <Globe className="size-4" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("settings.languageTitle")}
          className={cn(
            "absolute right-0 z-50 mt-2 min-w-[11rem] origin-top-right rounded-xl border border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)] py-2 shadow-float",
            // Scale + fade animation
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          {localeOptions.map((option) => {
            const isActive = option.locale === currentLocale;

            return (
              <button
                key={option.locale}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => switchTo(option.locale)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-[color:var(--primary-soft)]",
                  isActive
                    ? "font-semibold text-primary-strong"
                    : "text-foreground"
                )}
              >
                <span>{t(option.labelKey)}</span>
                {isActive && (
                  <span className="ml-2 text-xs text-primary-strong">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### Step 2: Verifikasi typecheck

```bash
cd /home/ilham827/balance-code && npm run typecheck
```
Expected: PASS — semua import valid, `settings.languageIdLabel` / `settings.languageEnLabel` / `settings.languageTitle` udah ada di i18n.

### Step 3: Commit

```bash
cd /home/ilham827/balance-code
git add components/landing/landing-locale-switcher.tsx
git commit -m "feat: add LandingLocaleSwitcher component with globe icon + dropdown"
```

---

## Task 2: Tambah switcher ke `LandingHeader` (desktop + mobile)

**Objective:** Integrasi `LandingLocaleSwitcher` ke header landing page.

**Files:**
- Modify: `/home/ilham827/balance-code/components/landing/landing-header.tsx`

### Step 1: Tambah import

**Line 6 — sesudah** import `LandingThemeToggle`:
```tsx
import { LandingLocaleSwitcher } from "@/components/landing/landing-locale-switcher";
```

### Step 2: Tambah di desktop nav (sebelah theme toggle)

**Line 100–108 — sebelum:**
```tsx
<div className="hidden items-center gap-2 lg:flex">
  <LandingThemeToggle />
  <Button href="/login" variant="ghost" size="sm" className="rounded-full px-4">
    {t("landing.navLogin")}
  </Button>
  <Button href="/register" size="sm" className="rounded-full px-5">
    {t("landing.navRegister")}
  </Button>
</div>
```

**Line 100–108 — sesudah:**
```tsx
<div className="hidden items-center gap-2 lg:flex">
  <LandingLocaleSwitcher />
  <LandingThemeToggle />
  <Button href="/login" variant="ghost" size="sm" className="rounded-full px-4">
    {t("landing.navLogin")}
  </Button>
  <Button href="/register" size="sm" className="rounded-full px-5">
    {t("landing.navRegister")}
  </Button>
</div>
```

### Step 3: Tambah di mobile menu

**Line 170–178 — sebelum:**
```tsx
<div className="border-t border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/42 px-4 py-4">
  <div className="flex flex-col gap-3">
    <LandingThemeToggle mobile />
    <Button href="/login" variant="ghost" className="rounded-full">
      {t("landing.navLogin")}
    </Button>
    <Button href="/register" className="rounded-full">
      {t("landing.navRegister")}
    </Button>
  </div>
</div>
```

**Line 170–178 — sesudah:**
```tsx
<div className="border-t border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/42 px-4 py-4">
  <div className="flex flex-col gap-3">
    <LandingLocaleSwitcher />
    <LandingThemeToggle mobile />
    <Button href="/login" variant="ghost" className="rounded-full">
      {t("landing.navLogin")}
    </Button>
    <Button href="/register" className="rounded-full">
      {t("landing.navRegister")}
    </Button>
  </div>
</div>
```

> **Catatan:** Di mobile menu, `LandingLocaleSwitcher` akan render globe button full-width karena dropdown-nya masih absolute ke kanan. Ini bisa di-adjust nanti dengan prop tambahan kalau layout mobile menu perlu berbeda.

### Step 4: Verifikasi typecheck

```bash
cd /home/ilham827/balance-code && npm run typecheck
```
Expected: PASS.

### Step 5: Commit

```bash
cd /home/ilham827/balance-code
git add components/landing/landing-header.tsx
git commit -m "feat: integrate LandingLocaleSwitcher into landing header (desktop + mobile)"
```

---

## Task 3: Tambah switcher ke auth pages (login + register)

**Objective:** Tambah `LandingLocaleSwitcher` di pojok kanan atas halaman login dan register.

**Files:**
- Modify: `/home/ilham827/balance-code/app/[locale]/login/page.tsx`
- Modify: `/home/ilham827/balance-code/app/[locale]/register/page.tsx`

### Step 1: Login page

**File:** `app/[locale]/login/page.tsx`

Karena login page adalah server component, switcher harus di-wrap dalam client boundary. Paling simpel: bikin inline wrapper.

**Tambahkan import di line 1-8:**
```tsx
import { LandingLocaleSwitcher } from "@/components/landing/landing-locale-switcher";
```

**Tambahkan switcher sebelum `<main>` (line 29):**
```tsx
return (
  <>
    {/* Language switcher — top right corner */}
    <div className="fixed top-4 right-4 z-50 md:top-6 md:right-10">
      <LandingLocaleSwitcher />
    </div>

    <main className="page-wrap section-gap">
      ...
    </main>
  </>
);
```

> **Kenapa `fixed` positioning:** Login/register page ga punya header, jadi switcher di-float di pojok kanan atas. `z-50` memastikan di atas `ToastFeedback`.

### Step 2: Register page

**File:** `app/[locale]/register/page.tsx`

Sama persis kayak login page.

**Tambahkan import:**
```tsx
import { LandingLocaleSwitcher } from "@/components/landing/landing-locale-switcher";
```

**Tambahkan switcher sebelum `<main>` (line 29):**
```tsx
return (
  <>
    <div className="fixed top-4 right-4 z-50 md:top-6 md:right-10">
      <LandingLocaleSwitcher />
    </div>

    <main className="page-wrap section-gap">
      ...
    </main>
  </>
);
```

### Step 3: Verifikasi typecheck

```bash
cd /home/ilham827/balance-code && npm run typecheck
```
Expected: PASS.

### Step 4: Commit

```bash
cd /home/ilham827/balance-code
git add app/[locale]/login/page.tsx app/[locale]/register/page.tsx
git commit -m "feat: add LandingLocaleSwitcher to login and register pages"
```

---

## Task 4: Verifikasi build & visual check

### Step 1: Build

```bash
cd /home/ilham827/balance-code && npm run build
```
Expected: PASS — ga ada error routing atau SSR.

### Step 2: Verifikasi manual (checklist)

- [ ] **Landing page desktop:** Globe icon muncul di header kanan, sebelah theme toggle
- [ ] **Landing page desktop:** Klik globe — dropdown muncul dengan animasi scale+fade, isi "Bahasa Indonesia" (checked) & "English"
- [ ] **Landing page desktop:** Klik "English" — redirect ke `/en/#...` (preserve section)
- [ ] **Landing page desktop:** Di English, dropdown nampilin "English" checked, "Bahasa Indonesia" unchecked
- [ ] **Landing page mobile:** Globe icon muncul di mobile menu
- [ ] **Landing page mobile:** Dropdown berfungsi dari dalam mobile menu
- [ ] **Login page:** Globe icon fixed di pojok kanan atas, tidak mengganggu layout form
- [ ] **Register page:** Globe icon fixed di pojok kanan atas, tidak mengganggu layout form
- [ ] **Auth pages:** Switch bahasa di login/register page → redirect ke locale baru, preserve query params (`?next=`, `?error=`)
- [ ] **Click outside:** Dropdown nutup pas klik di luar
- [ ] **Escape key:** Dropdown nutup pas tekan Escape
- [ ] **Light mode:** Switcher tetap terbaca (pakai theme tokens, bukan hardcoded colors)
- [ ] **Dark mode:** Switcher tetap terbaca
- [ ] **Dashboard (app pages):** Switcher TIDAK muncul (sesuai scope)

---

## Risiko & Trade-off

| Risiko | Mitigasi |
|--------|----------|
| Dropdown di mobile menu bisa kepotong | Absolute positioning dropdown ke kanan (`right-0`) — harusnya aman. Kalau mobile menu sempit, bisa adjust dengan `right-0` atau `-right-2` |
| Auth page switcher ketimpa element lain | `z-50` harusnya cukup. `ToastFeedback` ada di dalam `<main>`, ga overlap. |
| `animate-in` class butuh tailwindcss-animate | Cek apakah plugin `tailwindcss-animate` udah terpasang. Kalau belum, fallback ke transition manual. |

## Tailwind `animate-in` check

Sebelum commit Task 1, verifikasi bahwa `tailwindcss-animate` plugin terpasang:

```bash
grep "tailwindcss-animate" /home/ilham827/balance-code/package.json
```

Kalau ga ada, ganti animasi dari `animate-in fade-in-0 zoom-in-95` ke:

```tsx
className={cn(
  "absolute right-0 z-50 mt-2 min-w-[11rem] origin-top-right rounded-xl ...",
  "transition-all duration-200 ease-out",
  open ? "scale-100 opacity-100" : "scale-95 opacity-0"
)}
```

Dan tambah state-based rendering dengan `opacity-0 scale-95` default + useEffect untuk transisi mount.

## Yang TIDAK berubah

| Elemen | Kenapa |
|--------|--------|
| Struktur routing `[locale]` | Tidak diubah — locale tetap dari URL path |
| `lib/i18n.ts` | Tidak diubah — `localizePath`, `resolveLocale`, `getTranslator` tetap sama |
| `LocaleProvider` | Tidak diubah — provider tetap jalan seperti biasa |
| Dashboard / app pages | Tidak ditambah switcher (scope cuma landing + auth) |
| Cookie `balance-locale` | Tidak diubah — locale tetap disimpan di URL, bukan cookie |

---

## Summary

| File | Action | Impact |
|------|--------|--------|
| `components/landing/landing-locale-switcher.tsx` | Create | ~80 lines |
| `components/landing/landing-header.tsx` | Modify | +3 lines |
| `app/[locale]/login/page.tsx` | Modify | +4 lines |
| `app/[locale]/register/page.tsx` | Modify | +4 lines |

**Total:** 1 file baru, 3 file modifikasi, ~91 lines, 0 dependency baru.
