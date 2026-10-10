# Balance MCP Server — Desain

- **Tanggal:** 2026-10-10
- **Status:** Menunggu review
- **Cakupan:** Fase 1 — MCP server untuk pengguna Balance. MCP untuk developer/operator (tooling internal) adalah sub-proyek terpisah dan **tidak** dicakup di sini.

## 1. Tujuan

Pengguna Balance dapat menyambungkan klien AI yang mendukung remote MCP (Claude, ChatGPT, Cursor, dan sejenisnya) ke data keuangannya sendiri, lalu bertanya ("pengeluaran bulan ini berapa?") atau mencatat transaksi lewat percakapan. Berjalan di instalasi hosted (mybalance.my.id) maupun self-hosted.

Kriteria berhasil:
1. Klien MCP dapat terhubung ke `POST /api/mcp` dengan API key `bal_...` dan melihat enam tool.
2. Key `read` dapat membaca data tetapi tidak dapat menulis; key `read_write` dapat mencatat transaksi.
3. Tidak ada jalur bagi satu user untuk membaca atau menulis data wallet milik user lain.
4. Perilaku REST `/api/chat/*` yang sudah ada tidak berubah.

## 2. Keputusan

| Topik | Keputusan |
|---|---|
| Audiens | Pengguna Balance (developer tooling = sub-proyek terpisah) |
| Kemampuan | 5 tool read + 1 tool write (create-only; tanpa ubah/hapus) |
| Koneksi | Remote HTTP di aplikasi Balance, Streamable HTTP, stateless; auth dengan API key `bal_...` di header `Authorization: Bearer` |
| Pemilihan wallet | Agen memilih lewat `wallet_id` per tool, dengan `list_wallets` untuk menemukannya |
| Izin | Scope per key: `read` atau `read_write`. Key lama = `read_write` |
| Batas paket | Ikut perilaku API key sekarang: melewati batas paket, hanya kena rate limit teknis |
| Implementasi | SDK MCP resmi di route Next.js; tool membungkus fungsi yang sudah ada di `lib/ai/data.ts` |

Ditolak: JSON-RPC ditulis sendiri (beban perawatan spesifikasi), service MCP terpisah (kelebihan untuk enam tool, menambah beban deployment), OAuth (ditunda ke fase berikutnya).

## 3. Arsitektur

```
Klien MCP ──POST /api/mcp (Bearer bal_...)──▶ app/api/mcp/route.ts
                                               │ 1. verifyApiKey  → { userId, keyId, name, scope }
                                               │ 2. rate limit per key
                                               │ 3. transport MCP (stateless, Streamable HTTP)
                                               ▼
                                          lib/mcp/  (definisi tool + handler, zod)
                                               ▼
                                     lib/ai/data.ts (fungsi berbasis userId)
                                               ▼
                                          Supabase / Redis
```

- `app/api/mcp/route.ts`: hanya transport, auth, scope, rate limit, batas ukuran body.
- `lib/mcp/`: definisi tool (nama, deskripsi, schema input, anotasi, handler). Dapat dites tanpa HTTP.
- `lib/ai/data.ts`: tetap sumber logika bisnis. Tidak ada logika yang disalin.
- `GET /api/mcp` membalas `405` (tanpa stream SSE di fase ini).
- `proxy.ts` harus memastikan `/api/mcp` tidak terkena redirect locale atau pengecekan sesi cookie, sama seperti `/api/chat/*`.

## 4. Auth dan scope key

**Alur.** `verifyApiKey` memvalidasi hash dan status revoked, lalu menyentuh `last_used_at`. Hasilnya diperluas dengan `scope`. Pemanggil lama (`/api/chat/*`) tidak terpengaruh karena field baru hanya tambahan.

**Migrasi baru (satu file di `supabase/migrations/`).**
- `alter table public.user_api_keys add column scope text not null default 'read_write' check (scope in ('read','read_write'))`.
- `private.lookup_api_key` ikut mengembalikan `scope`.
- Perubahan yang sama dicerminkan di `supabase/init.sql` dan `docs/DB_SCHEMA.md`.

**Penegakan.** Dicek di sisi server di dalam handler `create_transaction`: key `read` ditolak dengan pesan jelas ("key ini read-only"). Tool tetap terdaftar dan terlihat agar agen dapat menjelaskan kegagalan.

**UI.** Form `createApiKey` (`app/actions/api-keys.ts`) mendapat pilihan scope dengan `read` sebagai default yang disarankan. Daftar key menampilkan scope. Teks ditambahkan ke `messages/id.json` dan `messages/en.json`.

**REST tidak berubah:** scope hanya berlaku di MCP.

## 5. Tool

| Tool | Jenis | Fungsi yang dipanggil | Input |
|---|---|---|---|
| `list_wallets` | read | `getAiWalletOptions(userId)` | — |
| `get_recap` | read | `getFinancialRecapForUser` | `period` (day/week/month), `wallet_id?` |
| `list_transactions` | read | `getRecentTransactionsForUser` | `wallet_id?`, `limit?` (default 12, maksimum 50) |
| `get_budget_status` | read | `getBudgetStatusForUser` | `wallet_id` (wajib) |
| `list_categories` | read | `getCategoriesForWallets` | `wallet_id?` |
| `create_transaction` | write | `createTransactionViaAi` | `wallet_id`, `kind`, `amount`, `category?`, `note?`, `date?` |

- Validasi input dengan `zod` (dependency baru; juga dibutuhkan SDK MCP). `wallet_id` harus UUID; `amount` bilangan positif.
- Deskripsi tool ditulis tegas: `create_transaction` menyuruh agen memanggil `list_wallets` bila wallet belum jelas dan mengonfirmasi ke user sebelum mencatat.
- Anotasi MCP: tool read bertanda `readOnlyHint`; `create_transaction` bukan read-only dan bukan destruktif.

**Dua hal yang harus diverifikasi saat implementasi:**
1. `createTransactionViaAi` harus menegakkan aturan yang sama dengan REST `/api/chat/transaction`: viewer ditolak, membership dicek, `consumeTransactionRateLimit` berlaku, cache wallet di-invalidate, notifikasi anggota dikirim. Bila ada yang kurang, disamakan lewat helper bersama, bukan salinan.
2. Fungsi-fungsi ini menerima `userId` dan kemungkinan memakai admin client, sehingga pengecekan membership di dalamnya adalah satu-satunya pagar. Harus dibuktikan dengan test lintas-user.

## 6. Error, rate limit, deployment

**Error.**
- Error protokol/auth: `401` (key hilang, tidak valid, revoked), `429` (rate limit) dengan `Retry-After` dan header dari `applyRateLimitHeaders`.
- Error tool (input salah, wallet bukan milik user, viewer, key `read` menulis, wallet tidak ditemukan): hasil tool dengan `isError: true` dan pesan yang jelas bagi agen.
- Detail internal (pesan Supabase, stack trace) tidak dikirim ke klien; hanya dicatat di log server. Key tidak pernah dicatat; hanya `key_prefix`.

**Rate limit.** `consumeChatApiRateLimit` per key (30 request/menit) dan `consumeTransactionRateLimit` per user untuk penulisan. Keduanya best-effort: tanpa Redis, tidak aktif (sama seperti REST) dan ini dicatat sebagai batasan di dokumentasi.

**Transport.** Stateless, aman untuk banyak instance di Docker. Batas ukuran body request menolak payload besar sebelum diparse.

**Cloudflare WAF.** Catatan di `docs/API_REFERENCE.md` soal pemblokiran request tanpa User-Agent yang sesuai juga berlaku untuk `/api/mcp`; didokumentasikan bahwa aturan WAF perlu mengizinkan path tersebut.

**Dokumentasi.** Bagian MCP baru di `docs/API_REFERENCE.md` (endpoint, scope, contoh konfigurasi klien), entri `CHANGELOG.md`, dan update `AGENTS.md` bila peta arsitektur berubah. Tidak ada env var baru yang wajib.

## 7. Testing dan verifikasi

Vitest di `tests/unit/`.

- **Scope:** key `read` ditolak di `create_transaction`; key `read_write` lolos; key lama diperlakukan `read_write`.
- **Validasi input:** `wallet_id` bukan UUID, `amount` nol/negatif, `period` tidak dikenal, `limit` melebihi batas.
- **Pemetaan error:** error tool menjadi `isError: true` dengan pesan bersih tanpa detail internal.
- **Handler tool** dengan fungsi `lib/ai/data.ts` di-mock.
- **Isolasi data (paling penting):** user A dengan `wallet_id` milik user B ditolak atau kosong; viewer tidak bisa mencatat transaksi; key revoked langsung ditolak.
- **Route:** `POST /api/mcp` dengan klien MCP dari SDK — `initialize`, `tools/list` (enam tool), `tools/call` tiap tool; tanpa Authorization → `401`; melewati rate limit → `429`.
- **Skema:** migrasi tercermin di `supabase/init.sql` dan `docs/DB_SCHEMA.md`.
- **Manual ujung ke ujung:** dev server + klien MCP sungguhan (MCP Inspector atau Claude Code) dengan key `read` dan `read_write`: baca rekap, lalu catat satu transaksi.
- **Gerbang CI:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

## 8. Di luar cakupan (ditunda)

OAuth; tool tabungan dan utang; tool tulis selain create (ubah/hapus, CRUD budget); stream SSE; MCP untuk developer/operator (sub-proyek B); gating MCP berdasarkan paket langganan.
