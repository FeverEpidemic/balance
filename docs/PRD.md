---
title: Balance — Product Requirements Document
version: 1.0.0
last_updated: 2026-06-09
author: FeverEpidemic
---

# Balance — Product Requirements Document

> Personal & shared household finance tracker. Waktu baca: ~10 menit.
> Dokumen ini dibuat untuk dibaca oleh AI agent maupun manusia.

---

## 1. Ringkasan Produk

**Balance** adalah aplikasi pencatatan keuangan rumah tangga (household finance tracker) berbasis web, dengan fokus pada kemudahan pencatatan transaksi harian, pengelolaan anggaran, tabungan, dan fitur kolaborasi dompet bersama.

- **Target pengguna:** Individu dan keluarga Indonesia yang ingin mencatat pemasukan & pengeluaran harian.
- **Bahasa:** Indonesia (default) dan Inggris.
- **Mata uang:** IDR (default, bisa dikustom per profil).
- **Platform:** Web (mobile-responsive, PWA-enabled).

---

## 2. Fitur & Fungsionalitas

### 2.1. Autentikasi & Profil

| Fitur | Status |
|-------|--------|
| Login via email (Supabase Auth) | ✅ Selesai |
| Login via Google OAuth | ✅ Selesai |
| Register akun baru | ✅ Selesai |
| Sinkronisasi profil dari auth.users (trigger) | ✅ Selesai |
| Onboarding flow (3 state: active, dismissed, completed) | ✅ Selesai |
| Tema (light, dark, system) via pengaturan profil | ✅ Selesai |
| Lokalisasi (id/en) via pengaturan profil | ✅ Selesai |
| API keys untuk integrasi eksternal | ✅ Selesai |

### 2.2. Manajemen Dompet (Wallet)

| Fitur | Status |
|-------|--------|
| Dompet pribadi (personal) | ✅ Selesai |
| Dompet bersama (shared) dengan undangan | ✅ Selesai |
| Role member: owner, editor, viewer | ✅ Selesai |
| Arsip dompet | ✅ Selesai |
| Batas kapasitas member per dompet (default: 5) | ✅ Selesai |
| Undangan via token + email | ✅ Selesai |

### 2.3. Transaksi

| Fitur | Status |
|-------|--------|
| Catat pemasukan (income) / pengeluaran (expense) | ✅ Selesai |
| Kategori transaksi (per wallet, dikelola user) | ✅ Selesai |
| Template transaksi untuk input cepat | ✅ Selesai |
| Split bill (equal/custom) untuk dompet bersama | ✅ Selesai |
| Settlement (pelunasan utang antar member) | ✅ Selesai |
| Sumber transaksi (manual, saving_adjustment, balance_adjustment) | ✅ Selesai |
| Riwayat transaksi dengan filter & pagination | ✅ Selesai |

### 2.4. Anggaran (Budget)

| Fitur | Status |
|-------|--------|
| Budget per kategori per bulan | ✅ Selesai |
| Progres budget vs realisasi di dashboard | ✅ Selesai |

### 2.5. Tabungan (Saving)

| Fitur | Status |
|-------|--------|
| Target tabungan dengan balance otomatis | ✅ Selesai |
| Deposit / withdraw dengan validasi saldo | ✅ Selesai |
| Sistem kategori otomatis (Tabungan / Pencairan Tabungan) | ✅ Selesai |
| Transaksi saving terhubung ke buku besar transaksi | ✅ Selesai |

### 2.6. Transaksi Berulang (Recurring)

| Fitur | Status |
|-------|--------|
| Frekuensi: daily, weekly, monthly | ✅ Selesai |
| Interval kustom (misal: setiap 2 minggu) | ✅ Selesai |
| Scheduler otomatis generate transaksi | ✅ Selesai |
| Status: active, paused, ended | ✅ Selesai |
| Deduplikasi (unique constraint) | ✅ Selesai |

### 2.7. Dashboard

| Fitur | Status |
|-------|--------|
| Ringkasan saldo per dompet | ✅ Selesai |
| Grafik pengeluaran harian (area chart) | ✅ Selesai |
| Progres budget bulan ini | ✅ Selesai |
| Transaksi terbaru | ✅ Selesai |
| Kartu onboarding untuk user baru | ✅ Selesai |

### 2.8. API Chat

| Fitur | Status |
|-------|--------|
| GET /api/chat/rekap — rekap keuangan per period (day/week/month) | ✅ Selesai |
| POST /api/chat/transaction — buat transaksi via API | ✅ Selesai |
| Autentikasi via API key (SHA256 hash) | ✅ Selesai |
| Rate limiting (Redis-based) | ✅ Selesai |

### 2.9. PWA

| Fitur | Status |
|-------|--------|
| Service worker | ✅ Selesai |
| Install prompt | ✅ Selesai |
| App manifest | ✅ Selesai |
| Offline page | ✅ Selesai |

---

## 3. Alur User Utama

### 3.1. Alur Transaksi Harian

1. User login → dashboard
2. Klik "Tambah Transaksi" → pilih dompet
3. Pilih jenis (income/expense), kategori, nominal, catatan
4. Simpan → transaksi langsung masuk, budget & grafik terupdate
5. (Opsional) Input cepat via template

### 3.2. Alur Dompet Bersama

1. Owner membuat wallet shared
2. Owner mengundang via email → generate token
3. Undangan dikirim (SST/Custom SMTP — tergantung setup)
4. Penerima klik link → accept invitation → jadi member
5. Member bisa input transaksi (sesuai role) & split bill

### 3.3. Alur Tabungan

1. User buat target tabungan (nama, nominal target opsional)
2. Deposit: masukkan nominal → otomatis:
   - Kurangi balance wallet
   - Buat transaksi expense kategori "Tabungan"
   - Tambah balance saving
3. Withdraw: sebaliknya → income kategori "Pencairan Tabungan"
4. Validasi: tidak boleh deposit melebihi available balance

### 3.4. Alur Transaksi Berulang

1. User buat recurring transaction (nama, nominal, frekuensi)
2. Scheduler (scripts/run-recurring-scheduler.mjs) jalan periodik
3. Panggil process_due_recurring_transactions() stored procedure
4. Generate transaksi baru untuk yang sudah jatuh tempo

### 3.5. Alur API Chat

1. User generate API key dari halaman Settings
2. Gunakan Bearer token di header Authorization
3. GET /api/chat/rekap?period=month → lihat rekap
4. POST /api/chat/transaction → input transaksi baru

---

## 4. Non-Functional Requirements

| Aspek | Detail |
|-------|--------|
| **Performa** | Data layer menggunakan React cache + Redis cache (best-effort) |
| **Keamanan** | RLS di semua tabel; semua mutasi via server actions; API key di-hash SHA256 |
| **Responsif** | Mobile-first, breakpoint Tailwind, PWA-enabled |
| **Dukungan tema** | Light mode + Dark mode (keduanya first-class) |
| **Lokalisasi** | next-intl via middleware, support id/en |
| **Deployment** | Docker (Next standalone + Caddy + Redis) |
| **ARM64** | Platform default produksi |

---

## 5. Batasan Produk (Saat Ini)

- Belum ada notifikasi push atau reminder
- Belum ada ekspor PDF/CSV
- Belum ada multi-mata uang per transaksi
- Belum ada kategori sistem untuk recurring transactions
- API key belum bisa di-revoke dari halaman Settings (perlu SQL manual)
- Cloudflare Managed Challenge dapat memblokir akses API dari script eksternal (solusi: WAF skip rule)

---

## 6. Evolusi Produk (Roadmap)

Lihat `docs/plans/PLAN.md` untuk visi awal & scope MVP.
Lihat `docs/plans/PLAN_UPGRADE.md` untuk rencana upgrade & backlog.

Fitur potensial ke depan:
- Integrasi bank (OCR / manual)
- Analisis pengeluaran & insight AI
- Multi-currency
- Budget carry-over
- Laporan bulanan PDF
