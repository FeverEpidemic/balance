---
title: Balance — Agent Quickstart
version: 1.2.0
last_updated: 2026-09-13
purpose: "Orientasi ringkas untuk AI agent yang baru bekerja di repo ini."
---

# Balance — Agent Quickstart

> Mulai dari panduan ini dan `AGENTS.md`. Baca dokumen lain sesuai area perubahan; tidak semua task perlu membaca seluruh dokumentasi.

## Alur baca

1. Baca `AGENTS.md` untuk aturan repo, keamanan, dan verifikasi.
2. Periksa source files yang akan diubah.
3. Untuk perubahan database, baca `docs/DB_SCHEMA.md` dan migration terbaru.
4. Untuk area khusus, ikuti `docs/SERVER_ACTION_PATTERNS.md`, `docs/API_REFERENCE.md`, `DESIGN.md`, atau `docs/TESTING_GUIDE.md` sesuai kebutuhan.
5. Cocokkan versi dependency dan script dengan `package.json`; workflow CI di `.github/workflows/ci.yml` menentukan urutan checks.

## Perintah utama

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

CI menjalankan lint, typecheck, test, lalu build. Jalankan checks yang sesuai dengan perubahan; perubahan dokumentasi cukup diverifikasi terhadap source dan link yang dirujuk.

## Arsitektur singkat

```
proxy.ts → locale routing dan session/auth boundary
app/[locale]/ → halaman localized
app/actions/ → mutasi UI
app/api/ → AI, chat integration, webhook, report, dan HTTP endpoints
lib/data/ → queries, mappers, loaders, Redis cache
Supabase/Postgres + RLS → persistent data
```

Komponen domain penting berada di `lib/ai/`, `lib/midtrans/`, `lib/pdf/`, dan `lib/push-helper.ts`. Translation dictionaries ada di `messages/id.json` dan `messages/en.json`; helper-nya ada di `lib/i18n.ts`.

## Aturan utama

1. **Jaga RLS.** Jangan gunakan admin/service key untuk alur user-facing. Setiap tabel baru harus mengaktifkan RLS dan memiliki policy sebelum dipakai; migration awal memberi grant luas ke role `authenticated`.
2. **Jaga kedua bahasa.** Tulis copy UI melalui helper i18n dan update terjemahan Indonesia serta Inggris dengan key dan placeholder yang sepadan.
3. **Jangan edit migration lama.** Tambahkan migration baru untuk perubahan schema.
4. **Redis tetap opsional.** Semua alur harus berfungsi jika Redis tidak tersedia atau dinonaktifkan.
5. **Pilih boundary mutasi yang tepat.** UI CRUD umumnya memakai server actions; webhooks, streaming, integrasi eksternal, health checks, dan unduhan memakai route handlers.
6. **Jaga Light dan Dark mode.** Gunakan semantic theme tokens dari `app/globals.css`, bukan warna hardcoded.
7. **Jaga cache dan UI tetap segar.** Ikuti invalidasi Redis dan revalidation path yang digunakan oleh action terkait.

## Peta file

| File | Kegunaan |
|------|----------|
| `proxy.ts` | Redirect locale dan pemeriksaan session pada request yang cocok |
| `app/actions/_shared.ts` | Helpers untuk form/action, locale, redirect, dan revalidation |
| `lib/auth.ts` | Auth helpers, termasuk `requireUser()` untuk alur yang memerlukan user |
| `lib/data/queries.ts` | Query Supabase |
| `lib/data/mappers.ts` | DB rows ke view model |
| `lib/data/index.ts` | Page data loaders |
| `lib/data/cache.ts` | Cache keys, TTLs, dan invalidation |
| `lib/i18n.ts` | Locale dan translation helpers |
| `lib/finance.ts` | Helper angka, mata uang, dan tanggal |
| `app/globals.css` | Theme tokens dan global styles |
| `supabase/migrations/` | Perubahan database berurutan |
| `tests/unit/` | Unit tests |

## Sebelum menyerahkan perubahan

- Ikuti pola authorization dan error handling pada action atau route yang serupa.
- Tambahkan atau perbarui unit test untuk perubahan logic yang dapat diuji secara deterministik.
- Jalankan lint, typecheck, dan tests untuk perubahan kode; lakukan build jika perubahan memengaruhi runtime atau konfigurasi.
- Pastikan perubahan copy tersedia pada kedua locale dan perubahan schema dicatat dalam migration baru.
