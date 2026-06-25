# Fix CTA Ghost Button Visibility — Landing Page

> **For Hermes:** Execute directly, single-task fix.

**Goal:** Perbaiki tombol "Open the app" / "Masuk ke aplikasi" di CTA section landing page agar border-nya terlihat jelas sebagai tombol, bukan teks ngambang.

**Architecture:** Ubah className override pada Button ghost di `/app/[locale]/page.tsx:370` — naikkan opacity border dari `border-white/30` ke `border-white/50` dan tambah ketebalan border.

---

## Masalah

Tombol ghost "Open the app" di CTA section punya `border-white/30` (border putih 30% opacity) di atas background `bg-primary` (hijau tua `#595f3d`). Border hampir tidak terlihat — user hanya melihat teks putih melayang tanpa wadah tombol. User tidak menyadari itu adalah elemen *clickable* (pelanggaran prinsip affordance).

### Sebelum (current)

```
┌────────────────────────────────────────────┐
│  READY TO START?                           │
│  If you want a calmer relationship...      │
│  Open an account, create your first...     │
│                                            │
│  ┌──────────────────┐  Open the app        │  ← "Open the app" floating text
│  │   Sign up free   │                      │    border ga keliatan
│  └──────────────────┘                      │
└────────────────────────────────────────────┘
```

### Sesudah (target)

```
┌────────────────────────────────────────────┐
│  READY TO START?                           │
│  If you want a calmer relationship...      │
│  Open an account, create your first...     │
│                                            │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │   Sign up free   │  │  Open the app  │  │  ← dua tombol jelas terpisah
│  └──────────────────┘  └────────────────┘  │    border terlihat
└────────────────────────────────────────────┘
```

---

## Task 1: Perbaiki border opacity dan ketebalan tombol ghost CTA

**Objective:** Naikkan visibility border tombol "Open the app" / "Masuk ke aplikasi" dari nyaris invisible menjadi jelas terlihat sebagai tombol.

**File:**
- Modify: `/home/ilham827/balance-code/app/[locale]/page.tsx:370`

**Langkah:**

### Step 1: Ubah className pada tombol ghost

**File:** `app/[locale]/page.tsx`

**Line 370 — sebelum:**
```tsx
<Button href="/login" variant="ghost" className="border-white/30 text-white hover:bg-white/10 px-6 py-3 font-semibold">{t("landing.ctaLogin")}</Button>
```

**Line 370 — sesudah:**
```tsx
<Button href="/login" variant="ghost" className="border-2 border-white/50 text-white hover:bg-white/10 hover:border-white/70 px-6 py-3 font-semibold">{t("landing.ctaLogin")}</Button>
```

**Perubahan:**
- `border-white/30` → `border-white/50` — border opacity naik dari 30% ke 50%
- Tambah `border-2` — border lebih tebal (2px), lebih terlihat sebagai kontur tombol
- Tambah `hover:border-white/70` — saat hover, border makin jelas (70% opacity)

### Step 2: Verifikasi typecheck

```bash
cd /home/ilham827/balance-code && npm run typecheck
```
Expected: PASS — tidak ada perubahan type signature, hanya className.

### Step 3: Verifikasi build (opsional tapi disarankan)

```bash
cd /home/ilham827/balance-code && npm run build
```
Expected: PASS — tidak ada perubahan struktur komponen.

### Step 4: Commit

```bash
cd /home/ilham827/balance-code
git add app/[locale]/page.tsx
git commit -m "fix: increase CTA ghost button border visibility (border-white/30 → border-white/50, add border-2)"
```

---

## Verifikasi Manual

Setelah deploy, buka landing page dan periksa:

- [ ] Tombol "Sign up free" dan "Open the app" terlihat sebagai **dua tombol terpisah**
- [ ] Border "Open the app" terlihat jelas (tidak tersamar oleh background hijau)
- [ ] Saat hover, border "Open the app" makin jelas (`hover:border-white/70`)
- [ ] Di mobile (stack vertikal), kedua tombol tetap terlihat jelas
- [ ] Tidak ada perubahan di light mode (CTA section selalu hijau tua, tidak terpengaruh tema)

---

## Risiko & Catatan

| Risiko | Mitigasi |
|--------|----------|
| `border-2` mungkin terlalu tebal secara visual | `border-2` = 2px, standar untuk tombol outline. Bisa di-rollback ke `border` (1px) + `border-white/60` jika kurang cocok |
| Tidak ada perubahan i18n | Aman — hanya className, tidak menyentuh key `landing.ctaLogin` |

## Yang TIDAK berubah

| Elemen | Kenapa |
|--------|--------|
| Teks tombol ("Open the app" / "Masuk ke aplikasi") | Bukan masalah copy, tapi visibility |
| Tombol "Sign up free" (primary) | Sudah benar — solid white, kontras jelas |
| Struktur flex layout | Tidak perlu diubah — gap dan stacking behavior sudah benar |
| Link href (`/login`) | Tidak berubah |
| Locale prefixing (`localizePath`) | Tidak tersentuh |

---

## Summary

| File | Perubahan | Impact |
|------|-----------|--------|
| `app/[locale]/page.tsx:370` | 3 nilai className diganti | ~5 karakter diubah |

**Total:** 1 file, 1 line, 3 token className berubah.
