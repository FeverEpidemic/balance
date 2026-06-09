---
title: Balance — Troubleshooting Guide
version: 1.0.0
last_updated: 2026-06-09
---

# Balance — Troubleshooting Guide

> Kumpulan error umum, penyebab, dan solusinya.

---

## 1. Supabase / Database Errors

### "infinite recursion detected in policy for relation"

**Penyebab:** RLS policy referensi tabel yang sama tanpa `security definer`.

**Solusi:** Ini adalah migrasi 0003 — pastikan semua policy menggunakan fungsi dari `private` schema:

```sql
-- ✅ Benar
USING (private.is_wallet_member(wallet_id))

-- ❌ Salah (menyebabkan infinite recursion)
USING (public.is_wallet_member(wallet_id))
```

### "current_balance_managed_by_entries"

**Penyebab:** Mencoba update `current_balance` di tabel `savings` secara manual.

**Solusi:** Jangan pernah update `savings.current_balance` langsung. Gunakan `saving_entries`:
- Deposit → INSERT ke `saving_entries` dengan `entry_type = 'deposit'`
- Withdraw → INSERT ke `saving_entries` dengan `entry_type = 'withdraw'`

Trigger `validate_and_apply_saving_entry` akan handle update balance otomatis.

### "saving_wallet_mismatch"

**Penyebab:** `wallet_id` di saving entry berbeda dengan `wallet_id` dari saving yang ditunjuk.

**Solusi:** Pastikan `wallet_id` di body request cocok dengan saving target.

### "saving_transaction_managed_by_entries"

**Penyebab:** Mencoba edit/hapus transaksi yang berasal dari saving entry (source = 'saving_adjustment').

**Solusi:** Transaksi saving tidak bisa diedit/dihapus manual. Edit/hapus saving entry-nya, nanti transaksi ikut terupdate.

### "insufficient_available_balance"

**Penyebab:** Mencoba deposit ke saving lebih besar dari available balance wallet.

**Solusi:** Cek balance wallet dulu sebelum deposit. Available balance = total income - total expense - total saving deposit.

### "insufficient_saving_balance"

**Penyebab:** Mencoba withdraw dari saving melebihi `current_balance` saving.

**Solusi:** Kurangi nominal withdraw.

### "saving_not_found"

**Penyebab:** `saving_id` tidak valid atau sudah dihapus.

**Solusi:** Validasi saving_id sebelum insert.

### "shared_saving_member_required"

**Penyebab:** Deposit ke saving di shared wallet tanpa menyertakan `member_user_id`.

**Solusi:** Untuk shared wallet, deposit saving wajib menyertakan `member_user_id`.

---

## 2. Auth Errors

### "duplicate key value violates unique constraint 'profiles_email_key'"

**Penyebab:** Email sudah terdaftar.

**Solusi:** Pakai fitur login, bukan register ulang.

### "new row violates row-level security policy"

**Penyebab:** User tidak punya akses ke resource yang dimaksud.

**Solusi:** Cek:
1. Apakah user adalah member wallet?
2. Apakah role user cukup (owner/editor untuk mutasi)?
3. Apakah RLS policy cocok?

### "authentication_required"

**Penyebab:** RPC dipanggil tanpa session.

**Solusi:** Pastikan user sudah login sebelum panggil RPC.

---

## 3. API Errors

### HTTP 401 — "unauthorized"

**Penyebab:** API key salah, revoked, atau format salah.

**Solusi:**
1. ✅ Pastikan key full length (47 karakter dengan prefix `bal_`)
2. ❌ Jangan pakai `bal_ro...Uk` di curl — terminal kirim literal dots!
3. Cek apakah key masih aktif (belum di-revoke)
4. Generate key baru dari Settings → API Keys

### HTTP 429 — "rate_limit_exceeded"

**Penyebab:** Lebih dari 30 request per menit.

**Solusi:** Tunggu 1 menit atau kurangi frekuensi request.

### HTTP 403 — Cloudflare "Just a moment..."

**Penyebab:** Cloudflare Managed Challenge memblokir request dari Docker/server headless.

**Solusi:** 
1. Dashboard Cloudflare → Security → WAF → Custom Rules
2. Buat rule: URI Path starts with `/api/` → Skip Managed Challenge
3. Atau Page Rule: `acknowledge.my.id/api/*` → Security Level: Essentially Off

### HTTP 400 — "wallet_id is required"

**Penyebab:** Field `wallet_id` tidak dikirim di POST body.

**Solusi:** Pastikan body JSON valid dan `wallet_id` ada.

---

## 4. Recurring Scheduler Errors

### Transaksi recurring tidak muncul

**Penyebab Mungkin:**
- Scheduler tidak jalan
- `next_run_at` masih di masa depan
- Status recurring bukan 'active'
- `end_date` sudah lewat

**Cek:**
```sql
-- Cek status
SELECT id, status, next_run_at, end_date, last_generated_at
FROM recurring_transactions
WHERE wallet_id = '<wallet-id>';

-- Manual trigger (via Supabase SQL editor)
SELECT public.process_due_recurring_transactions();
```

**Jalankan scheduler:**
```bash
npm run scheduler:recurring
```

### "unique_violation" di scheduler log

**Penyebab:** Transaksi untuk kombinasi `(recurring_transaction_id, recurring_scheduled_for)` sudah ada.

**Solusi:** Aman — scheduler skip duplicate. Ini fitur idempotency.

---

## 5. Cache Issues

### Data tidak update setelah mutasi

**Penyebab:** Redis cache belum di-invalidate.

**Solusi:** Pastikan server action panggil:
```typescript
import { invalidateWalletReadCaches } from "@/lib/data/cache";
await invalidateWalletReadCaches(walletId, userId);
```

### Data masih lama setelah invalidasi

**Penyebab:** React cache (per request) masih hold data lama.

**Solusi:** Pastikan `revalidatePath()` atau `revalidateTag()` dipanggil setelah mutasi.

---

## 6. Deployment Errors

### "Module not found: Can't resolve 'server-only'"

**Penyebab:** File di `lib/` di-import dari komponen client.

**Solusi:** Pastikan file dengan `import "server-only"` tidak di-import dari `"use client"` komponen.

### Build gagal karena type error

**Penyebab:** TypeScript strict mode.

**Solusi:** 
```bash
npm run typecheck  # Cari error
npx tsc --noEmit   # Detail error
```

### Docker build lambat

**Penyebab:** Cache layer npm install tidak optimal.

**Solusi:** Pastikan `package.json` dan `package-lock.json` di-copy SEBELUM `npm ci` di Dockerfile.

---

## 7. Development Issues

### Hot reload tidak jalan

**Penyebab:** File di luar `app/` atau `components/` tidak terdeteksi.

**Solusi:** Restart dev server: `npm run dev`

### test runner error: "Cannot find module @/..."

**Penyebab:** Path alias tidak terdaftar di vitest config.

**Solusi:** Cek `vitest.config.ts` — pastikan ada `resolve.alias` untuk `@/`.

### Form submit tidak menghasilkan redirect

**Penyebab:** Server action return error object, bukan redirect.

**Solusi:** Cek response `useActionState` — mungkin ada validation error.
