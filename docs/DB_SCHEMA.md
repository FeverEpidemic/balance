---
title: Balance — Database Schema & Data Flow
version: 1.0.0
last_updated: 2026-06-09
migrations: 0001–0014
---

# Balance — Database Schema & Data Flow

> Diagram alur data, relasi tabel, RLS policies, dan business logic di database Supabase PostgreSQL.
> Dokumen ini dibuat untuk dibaca oleh AI agent maupun manusia.

---

## 1. Custom Types (Enums)

| Type | Values |
|------|--------|
| `wallet_kind` | `personal`, `shared` |
| `wallet_role` | `owner`, `editor`, `viewer` |
| `transaction_kind` | `income`, `expense` |
| `transaction_source` | `manual`, `saving_adjustment`, `balance_adjustment` |
| `invitation_status` | `pending`, `accepted`, `revoked`, `expired` |
| `split_type` | `equal`, `custom` |
| `recurring_frequency` | `daily`, `weekly`, `monthly` |
| `recurring_status` | `active`, `paused`, `ended` |
| `saving_entry_type` | `deposit`, `withdraw` |

---

## 2. Entity Relationship Diagram (Textual)

```
auth.users
    │ (1:N via trigger handle_auth_user_sync)
    ▼
profiles ─────────────────────────────────────────┐
    │ (id PK, FK → auth.users)                    │
    │                                              │
    │┌─ wallets.owner_user_id (FK → profiles.id)   │
    │├─ wallets.created_by (FK → profiles.id)      │
    │├─ wallets.created_by (FK → profiles.id)      │
    │├─ wallet_members.user_id (FK → profiles.id)  │
    │├─ wallet_invitations.invited_by (FK →... )   │
    │└─ transactions.created_by (FK → profiles.id) │
    │  ... (audit trail: created_by / updated_by)   │
    │                                              │
wallets ──── wallet_members ──── wallet_invitations
    │             │
    │             ▼
    ├─── categories
    ├─── budgets
    ├─── transactions ─── transaction_splits
    ├─── settlements
    ├─── transaction_templates
    ├─── recurring_transactions
    ├─── savings ─────── saving_entries
    │
user_api_keys (terikat ke auth.users, bukan profiles)
```

---

## 3. Detail Tabel

### 3.1. profiles

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | Sama dengan auth.users.id |
| full_name | text? | Dari metadata OAuth / registrasi |
| email | text unique | |
| default_currency | text DEFAULT 'IDR' | |
| onboarding_state | text DEFAULT 'active' | 'active', 'dismissed', 'completed' |
| onboarding_dismissed_at | timestamptz? | |
| onboarding_completed_at | timestamptz? | |
| theme_preference | text DEFAULT 'system' | 'light', 'dark', 'system' |
| preferred_locale | text DEFAULT 'id' | 'id', 'en' |
| created_at / updated_at | timestamptz | |

**Trigger:** `on_auth_user_synced` — insert/update dari `auth.users` (termasuk fallback `full_name` dari `raw_user_meta_data->>'name'` untuk Google OAuth).

**RLS:**
- SELECT: hanya diri sendiri (`id = auth.uid()`)
- UPDATE: hanya diri sendiri

### 3.2. wallets

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | gen_random_uuid() |
| name | text | Nama dompet |
| kind | wallet_kind | personal / shared |
| currency | text | NOT NULL DEFAULT 'IDR' |
| owner_user_id | uuid FK → profiles | Pemilik |
| is_archived | boolean DEFAULT false | |
| created_by / updated_by | uuid? FK → profiles | Audit trail |
| created_at / updated_at | timestamptz | |

**RLS:**
- SELECT: member dompet ATAU owner (`private.is_wallet_member(id) OR owner_user_id = auth.uid()`)
- INSERT: `owner_user_id = auth.uid()`
- UPDATE: hanya owner via `private.has_wallet_role(id, array['owner'])`

### 3.3. wallet_members

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | |
| user_id | uuid FK → profiles | |
| role | wallet_role DEFAULT 'viewer' | owner, editor, viewer |
| created_by / updated_by | uuid? FK → profiles | |
| created_at / updated_at | timestamptz | |
| **UNIQUE** | (wallet_id, user_id) | |

**RLS:**
- SELECT: member dompet
- INSERT: owner ATAU saat user daftar sebagai owner baru (saat buat wallet)
- UPDATE: owner

**Kapasitas:** Dibatasi `MAX_WALLET_MEMBER_CAPACITY = 5` via trigger (`private.enforce_wallet_member_capacity`)

### 3.4. wallet_invitations

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | |
| invited_email | text | Email yang diundang |
| role | wallet_role DEFAULT 'viewer' | |
| token | text UNIQUE | Token rahasia undangan |
| status | invitation_status DEFAULT 'pending' | |
| invited_by | uuid FK → profiles | |
| accepted_by | uuid? FK → profiles | |
| expires_at | timestamptz | Batas waktu |
| created_at / updated_at | timestamptz | |

**RLS:**
- SELECT: member ATAU orang yang diundang (cocok email)
- INSERT: owner
- UPDATE: owner ATAU orang yang diundang (accept/revoke)

### 3.5. categories

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | Per-wallet |
| name | text | Nama kategori |
| kind | transaction_kind | income / expense |
| color | text DEFAULT '#595f3d' | Warna chip |
| is_system | boolean DEFAULT false | System-generated (Tabungan, dll) |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |
| **UNIQUE** | (wallet_id, name, kind) | |

**RLS:** SELECT semua member; mutasi hanya owner/editor.

### 3.6. budgets

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | |
| category_id | uuid FK → categories | |
| month_start | date | Awal bulan budget |
| amount | numeric(14,2) | >= 0 |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |
| **UNIQUE** | (wallet_id, category_id, month_start) | |

**RLS:** SELECT semua member; mutasi hanya owner/editor.

### 3.7. transactions

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | |
| category_id | uuid? FK → categories (ON DELETE SET NULL) | |
| kind | transaction_kind | income / expense |
| amount | numeric(14,2) | > 0 |
| happened_at | timestamptz | Waktu transaksi |
| note | text? | Catatan |
| merchant | text? | Merchant (untuk API chat) |
| split_type | split_type? | Untuk split bill |
| source | transaction_source DEFAULT 'manual' | manual, saving_adjustment, balance_adjustment |
| saving_entry_id | uuid? FK → saving_entries (ON DELETE SET NULL) | Link ke saving (jika via tabungan) |
| recurring_transaction_id | uuid? FK → recurring_transactions (ON DELETE SET NULL) | Link ke recurring |
| recurring_scheduled_for | timestamptz? | Jadwal recurring |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |

**Index:** `(wallet_id, happened_at DESC)`
**RLS:** SELECT semua member; mutasi hanya owner/editor.
**Constraint Unik:** `(recurring_transaction_id, recurring_scheduled_for)` WHERE `recurring_transaction_id IS NOT NULL`
**Constraint Unik:** `(saving_entry_id)` WHERE `saving_entry_id IS NOT NULL`
**Trigger:** `prevent_saving_transaction_update` & `prevent_saving_transaction_delete` — tidak bisa edit/hapus transaksi yang berasal dari saving.

### 3.8. transaction_splits

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| transaction_id | uuid FK → transactions | |
| wallet_id | uuid FK → wallets | |
| member_user_id | uuid FK → profiles | |
| owed_amount | numeric(14,2) | >= 0 |
| paid_amount | numeric(14,2) DEFAULT 0 | >= 0 |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |
| **UNIQUE** | (transaction_id, member_user_id) | |

### 3.9. settlements

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | |
| payer_user_id | uuid FK → profiles | |
| payee_user_id | uuid FK → profiles | |
| amount | numeric(14,2) | > 0 |
| happened_at | timestamptz | |
| note | text? | |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |

### 3.10. transaction_templates

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | |
| category_id | uuid? FK → categories | |
| name | text | |
| kind | transaction_kind | |
| default_amount | numeric(14,2)? | >= 0 |
| note | text? | |
| split_type | split_type? | |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |
| **UNIQUE** | (wallet_id, name) | |

### 3.11. recurring_transactions

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | |
| category_id | uuid? FK → categories | |
| kind | transaction_kind | |
| amount | numeric(14,2) | > 0 |
| note | text? | |
| frequency | recurring_frequency | |
| interval_count | integer DEFAULT 1 | |
| start_date | date | |
| end_date | date? | |
| next_run_at | timestamptz | |
| status | recurring_status DEFAULT 'active' | |
| last_generated_at | timestamptz? | |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |

**Index:** `(status, next_run_at)` — untuk scheduler query.
**RLS:** SELECT semua member; mutasi owner/editor.

### 3.12. savings & saving_entries

**savings**

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| wallet_id | uuid FK → wallets | |
| name | text | Nama tabungan |
| target_amount | numeric(14,2)? | null = tanpa target |
| current_balance | numeric(14,2) DEFAULT 0 | >= 0 |
| is_archived | boolean DEFAULT false | |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |
| **UNIQUE** | (wallet_id, name) | |

**saving_entries**

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| saving_id | uuid FK → savings | |
| wallet_id | uuid FK → wallets | |
| entry_type | saving_entry_type | deposit / withdraw |
| amount | numeric(14,2) | > 0 |
| happened_at | timestamptz | |
| note | text? | |
| member_user_id | uuid? FK → profiles | Untuk shared wallet |
| created_by / updated_by | uuid? | |
| created_at / updated_at | timestamptz | |

**Trigger logika saving:**
1. `lock_saving_balance_change` — mencegah update langsung `current_balance` di savings
2. `validate_and_apply_saving_entry` — validasi + update balance saving otomatis
3. `create_transaction_from_saving_entry` — auto-create transaksi income/expense

### 3.13. user_api_keys

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| name | text | Nama key |
| key_hash | text | SHA256 hash |
| key_prefix | text | Prefix untuk display |
| created_at | timestamptz | |
| last_used_at | timestamptz? | |
| revoked_at | timestamptz? | |

**Fungsi:** `private.lookup_api_key(hash)` — untuk verifikasi API gateway
**RLS:** Setiap user hanya bisa lihat/edit/hapus key miliknya sendiri.

---

## 4. RLS Strategy

Semua tabel di-public schema menggunakan **RLS berbasis keanggotaan dompet**:

```
Setiap data sensitif: SELECT hanya untuk WALLET MEMBER
Setiap mutasi: INSERT/UPDATE/DELETE hanya untuk OWNER atau EDITOR
```

### Fungsi Bantuan

| Fungsi | Lokasi | Keterangan |
|--------|--------|-----------|
| `private.is_wallet_member(uuid)` | private schema (security definer) | Cek apakah user adalah member suatu wallet |
| `private.has_wallet_role(uuid, wallet_role[])` | private schema (security definer) | Cek apakah user punya role tertentu |
| `public.is_wallet_member(uuid)` | public schema | Versi non-definer (untuk SELECT dari client) — **tidak dipakai** setelah migrasi 0003 |

> **Catatan:** Migrasi 0003 memindahkan fungsi RLS ke `private` schema dengan `security definer` untuk menghindari infinite recursion policy.

---

## 5. Data Flow Penting

### 5.1. Auth Sync Flow

```
auth.users INSERT/UPDATE
    → trigger on_auth_user_synced
    → private.handle_auth_user_sync()
    → INSERT OR UPDATE profiles (id, full_name, email, default_currency)
```

### 5.2. Saving Entry Flow

```
INSERT saving_entries
    → trigger validate_and_apply_saving_entry
        → validasi: saving_wallet_mismatch, shared_saving_member_required, insufficient_balance
        → UPDATE savings.current_balance (+/- amount)
    → trigger create_transaction_from_saving_entry
        → INSERT transactions (kind=expense untuk deposit, kind=income untuk withdraw)
        → category: "Tabungan" (expense) / "Pencairan Tabungan" (income)
        → source: 'saving_adjustment'
```

### 5.3. Recurring Transaction Flow

```
scripts/run-recurring-scheduler.mjs (cron / loop)
    → SELECT public.process_due_recurring_transactions(run_until, batch_size)
    → FOR EACH active recurring WHERE next_run_at <= run_until:
        → INSERT transaction (dengan recurring_transaction_id + recurring_scheduled_for)
        → UPDATE next_run_at = next_occurrence()
        → Jika melewati end_date → status = 'ended'
```

### 5.4. Invitation Acceptance Flow

```sql
SELECT public.accept_wallet_invitation_atomic(token, user_id)
    → UPDATE status = 'accepted'
    → INSERT wallet_members (wallet_id, user_id, role, ...)
    → Semua dalam 1 transaksi atomik
```

---

## 6. Indexes

| Tabel | Index | Tujuan |
|-------|-------|--------|
| wallet_members | (user_id, wallet_id) | Cepat cek keanggotaan |
| wallet_invitations | (wallet_id, invited_email) | Cari undangan | 
| categories | (wallet_id, kind) | Filter kategori per wallet |
| budgets | (wallet_id, month_start) | Query budget bulanan |
| transactions | (wallet_id, happened_at DESC) | Riwayat transaksi |
| transaction_splits | (wallet_id, member_user_id) | Split bill per member |
| settlements | (wallet_id, happened_at DESC) | Riwayat settlement |
| templates | (wallet_id, kind) | Filter template |
| recurring_transactions | (status, next_run_at) | Scheduler query |
| recurring_transactions | (wallet_id, status, next_run_at) | Query per wallet |
| savings | (wallet_id, is_archived, name) | Daftar tabungan |
| saving_entries | (saving_id, happened_at DESC) | Riwayat saving |
| saving_entries | (wallet_id, member_user_id) | Per member |
| user_api_keys | (user_id) | Key management |
| user_api_keys | (key_hash) | API gateway lookup |

---

## 7. Migration History

| # | Nama | Perubahan Utama |
|---|------|----------------|
| 0001 | balance_mvp | Schema awal: semua tabel inti, RLS, index, trigger |
| 0002 | balance_auth_sync | Auth sync trigger + self-register saat buat wallet |
| 0003 | fix_wallet_rls_recursion | Pindah fungsi RLS ke private schema (security definer) |
| 0004 | wallet_invites_token_only | Invitation acceptance via token saja |
| 0005 | wallet_member_capacity | Batas 5 member per wallet |
| 0006 | recurring_transactions | Transaksi berulang + scheduler stored procedure |
| 0007 | savings | Tabungan + saving entries |
| 0008 | saving_entry_transactions | Auto-transaction dari saving entries, trigger proteksi |
| 0009 | google_oauth_profile_name_fallback | Fallback full_name dari metadata 'name' |
| 0010 | transaction_balance_adjustments | Kolom source, kategori penyesuaian saldo |
| 0011 | user_api_keys | Tabel API key + lookup function |
| 0012 | user_onboarding | Kolom onboarding_state di profiles |
| 0013 | profile_theme_preference | Kolom theme_preference di profiles |
| 0014 | profile_preferred_locale | Kolom preferred_locale di profiles |
