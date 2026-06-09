---
title: Balance — Agent Quickstart
version: 1.0.0
last_updated: 2026-06-09
purpose: "Bacaan pertama untuk AI agent baru di repo ini. 5 menit."
---

# Balance — Agent Quickstart

> Selamat datang di repo Balance! Dokumen ini adalah titik awal yang harus kamu baca sebelum menyentuh kode apa pun.

---

## 🗺️ Order Baca Dokumen

Baca dengan urutan ini untuk pemahaman maksimal:

| # | Dokumen | Isi | Waktu |
|---|---------|-----|-------|
| 1 | `docs/PRD.md` | Visi produk, fitur, alur user | 10 menit |
| 2 | `docs/DB_SCHEMA.md` | Semua tabel, relasi, RLS, data flow | 15 menit |
| 3 | `docs/ENGINEERING.md` | Stack, routing, data layer, deployment | 15 menit |
| 4 | `AGENTS.md` | Panduan coding, konvensi, testing | 5 menit |
| 5 | `AGENT_HANDOFF.md` | Protokol handoff antar agent | 3 menit |
| 6 | `DESIGN.md` | Design system Serene Capital | 5 menit |
| 7 | `docs/SERVER_ACTION_PATTERNS.md` | Pola server action & error handling | 5 menit |
| 8 | `docs/TESTING_GUIDE.md` | Cara testing & pola umum | 5 menit |
| 9 | `docs/API_REFERENCE.md` | Dokumentasi chat API | 3 menit |

**Total:** ~66 menit. Tapi sangat penting untuk konteks yang benar.

---

## ⚡ Commands Cepat

```bash
npm run dev              # Development server
npm run typecheck        # TypeScript strict check
npm run test             # Unit test
npm run test:unit        # Sama
npm run build            # Production build
npm run lint             # ESLint
npm run scheduler:recurring  # Generate recurring transactions
```

---

## 🏗️ Arsitektur dalam 30 Detik

```
[Browser] ↔ Server Components (read) & Server Actions (write)
    ↓
[lib/data/index.ts]   ← React.cache + Redis (best-effort)
    ↓
[lib/data/queries.ts] → [Supabase + RLS]
    ↓
[app/actions/*.ts]    → Mutasi via server actions
```

### Aturan Emas:

1. **Jangan bypass RLS** — `SUPABASE_SECRET_KEY` hanya untuk admin/server-only. Semua mutasi user-facing harus lewat client yang terikat session.
2. **Jangan hardcode warna** — Pakai semantic theme tokens dari `app/globals.css`. Light mode + Dark mode adalah first-class.
3. **Jangan edit migration lama** — Migration baru saja untuk perubahan schema.
4. **Redis optional** — Fitur harus tetap jalan saat Redis mati.
5. **Semua mutasi = server action** — Bukan API route, bukan client-side mutation.

---

## 📁 File Penting untuk Dihafal

| File | Kenapa Penting |
|------|---------------|
| `lib/data/queries.ts` | Semua read query ke Supabase |
| `lib/data/mappers.ts` | Transform DB → UI model |
| `lib/data/cache.ts` | Redis cache keys & TTL |
| `lib/data/index.ts` | Composed loaders (pintu masuk data) |
| `lib/auth.ts` | requireUser() — wajib dipanggil di setiap server action |
| `lib/finance.ts` | Helper format mata uang & tanggal |
| `lib/i18n.ts` | Translate & locale resolution |
| `app/actions/_shared.ts` | Shared helpers: redirect, revalidate, form parsing |
| `app/globals.css` | Theme tokens (light + dark) |

---

## 🧪 Saat Bikin Perubahan Baru

1. Baca `AGENTS.md` → pahami konvensi coding
2. Cek migration terakhir → pahami schema terkini
3. Pastikan light mode + dark mode aman
4. Tambah/update unit test di `tests/unit/`
5. Update `CHANGELOG.md`
6. `npm run typecheck && npm run test` sebelum push

---

## 🚨 Hal yang Sering Bikin Agent Baru Salah

- ❌ **Ngedit migration lama** — Jangan! Migration baru aja.
- ❌ **Hardcode warna** — Pakai CSS variables dari globals.css.
- ❌ **Lupa cek dark mode** — Semua UI harus aman di dua mode.
- ❌ **Redis dianggap wajib** — Fitur harus jalan tanpa Redis.
- ❌ **API key ditulis `bal_ro...Uk` di curl** — Terminal kirim literal, bukan full key. Selalu full key.
- ❌ **Lupa panggil `requireUser()`** — Semua server action butuh auth check.
