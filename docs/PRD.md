---
title: Balance — Product Requirements Document
version: 1.2.0
last_updated: 2026-06-22
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
- **Mata uang:** Multi-currency (IDR default, bisa dikustom per wallet).
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
| Timezone auto-detect | ✅ Selesai |

### 2.2. Manajemen Dompet (Wallet)

| Fitur | Status |
|-------|--------|
| Dompet pribadi (personal) | ✅ Selesai |
| Dompet bersama (shared) dengan undangan | ✅ Selesai |
| Role member: owner, editor, viewer | ✅ Selesai |
| Arsip dompet | ✅ Selesai |
| Batas kapasitas member per dompet (default: 5) | ✅ Selesai |
| Undangan via token + email | ✅ Selesai |
| Multi-currency per wallet (IDR, USD, dll) | ✅ Selesai |

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
| **Batch input** — input banyak transaksi sekaligus dalam satu form | ✅ Selesai |
| **Debt tracker** — catat utang/piutang dengan siapapun (text bebas), dukung cicilan & auto-update status | ✅ Selesai |
| **OCR scan struk** — foto struk → auto-fill transaksi via Gemini Vision | ✅ Selesai |

### 2.4. Anggaran (Budget)

| Fitur | Status |
|-------|--------|
| Budget per kategori per bulan | ✅ Selesai |
| Progres budget vs realisasi di dashboard | ✅ Selesai |
| **Carry-over toggle** — bawa sisa budget bulan sebelumnya ke bulan ini (opsional per kategori, rekursif antar bulan) | ✅ Selesai |

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
| Kartu Available Budget (sisa anggaran aktif) | ✅ Selesai |
| Transaksi terbaru | ✅ Selesai |
| Kartu onboarding untuk user baru | ✅ Selesai |
| Insight AI di dashboard | ✅ Selesai |

### 2.8. Asisten AI (Chat)

| Fitur | Status |
|-------|--------|
| Halaman chat dengan natural language | ✅ Selesai |
| Rekap keuangan via chat (day/week/month) | ✅ Selesai |
| Pencatatan transaksi via AI (confidence-based) | ✅ Selesai |
| Pengelolaan anggaran via AI | ✅ Selesai |
| Deteksi duplikat + konfirmasi transaksi | ✅ Selesai |
| Insight AI di dashboard | ✅ Selesai |
| Panduan cepat AI di header chat | ✅ Selesai |
| Compliance gate (opt-in AI, privacy notice) | ✅ Selesai |
| Token budgeting & sliding window history | ✅ Selesai |
| Rate limiting AI Chat + daily limit | ✅ Selesai |
| Free trial 7 hari Premium (AI unlimited) | ✅ Selesai |

### 2.9. API Chat

| Fitur | Status |
|-------|--------|
| GET /api/chat/rekap — rekap keuangan per period (day/week/month) | ✅ Selesai |
| POST /api/chat/transaction — buat transaksi via API | ✅ Selesai |
| Autentikasi via API key (SHA256 hash) | ✅ Selesai |
| Rate limiting (Redis-based) | ✅ Selesai |

### 2.10. Export & Reporting

| Fitur | Status |
|-------|--------|
| Export Excel (.xlsx) untuk transaksi | ✅ Selesai |
| Export PDF laporan bulanan (premium-only) | ✅ Selesai |
| Changelog page + popup "Yang Baru" | ✅ Selesai |

### 2.11. PWA

| Fitur | Status |
|-------|--------|
| Service worker | ✅ Selesai |
| Install prompt | ✅ Selesai |
| App manifest | ✅ Selesai |
| Offline page | ✅ Selesai |
| Background sync queue (offline transactions) | ✅ Selesai |

### 2.12. Push Notification & Daily Reminder

| Fitur | Status |
|-------|--------|
| **Web Push subscription** — dari halaman Settings | ✅ Selesai |
| **Daily reminder** — notifikasi harian untuk catat transaksi | ✅ Selesai |
| **Kustomisasi waktu** — pilih jam pengingat (timezone-aware) | ✅ Selesai |
| **Auto-cleanup** — hapus subscription invalid jika browser blokir | ✅ Selesai |

### 2.13. Premium & Midtrans

| Fitur | Status |
|-------|--------|
| Midtrans Snap payment integration | ✅ Selesai |
| Paket Bulanan (Rp 29.000/bln) | ✅ Selesai |
| Paket Tahunan (Rp 250.000/thn, hemat 28%) | ✅ Selesai |
| Multi metode pembayaran (GoPay, Bank Transfer, QRIS, dll) | ✅ Selesai |
| Verifikasi signature SHA512 | ✅ Selesai |
| Riwayat pembayaran & status langganan | ✅ Selesai |
| Scheduler auto-expire saat langganan habis | ✅ Selesai |
| Periode Premium dihitung setelah trial berakhir | ✅ Selesai |

---

## 3. Alur User Utama

### 3.1. Alur Transaksi Harian

1. User login → dashboard
2. Klik "Tambah Transaksi" → pilih dompet
3. Pilih jenis (income/expense), kategori, nominal, catatan
4. Simpan → transaksi langsung masuk, budget & grafik terupdate
5. (Opsional) Input cepat via template
6. (Opsional) Input batch — tambah baris untuk transaksi multiple
7. (Opsional) Scan struk — foto → AI auto-fill

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

### 3.5. Alur Debt Tracker

1. User buka tab "Utang/Piutang" di detail dompet
2. Catat utang atau piutang dengan pihak eksternal (nama text bebas)
3. Atur nominal, cicilan (opsional), dan status awal
4. Saat ada pembayaran, record payment → auto-update status
5. Status: active → (sebagian/settled/cancelled)

### 3.6. Alur AI Chat

1. User buka halaman `/chat` → compliance gate (opt-in pertama kali)
2. User pilih periode & wallet, lalu ketik pertanyaan natural
3. AI (DeepSeek) membaca konteks finansial → jawab dengan data
4. Untuk mutasi: AI deteksi intent → confidence check → auto-save atau minta konfirmasi
5. Rivayat chat disimpan di localStorage browser

### 3.7. Alur API Chat

1. User generate API key dari halaman Settings
2. Gunakan Bearer token di header Authorization
3. GET /api/chat/rekap?period=month → lihat rekap
4. POST /api/chat/transaction → input transaksi baru

### 3.8. Alur Push Notification

1. User buka Settings → aktifkan daily reminder
2. Pilih jam pengingat (contoh: 20:00 WIB)
3. Browser minta izin notifikasi → user allow
4. Subscription dikirim ke server → simpan di DB
5. Scheduler kirim notifikasi setiap jam yang dipilih
6. User klik notifikasi → buka dashboard

### 3.9. Alur Premium Payment

1. User buka Settings → "Langganan Premium"
2. Pilih paket: Bulanan (Rp 29.000) atau Tahunan (Rp 250.000)
3. Redirect ke Midtrans Snap → pilih metode bayar
4. Bayar → Midtrans kirim notifikasi ke server
5. Server verifikasi signature → update plan_type user
6. Jika masih trial → Premium mulai setelah trial habis

---

## 4. Non-Functional Requirements

| Aspek | Detail |
|-------|--------|
| **Performa** | Data layer menggunakan React cache + Redis cache (best-effort) |
| **Keamanan** | RLS di semua tabel; semua mutasi via server actions; API key di-hash SHA256 |
| **Responsif** | Mobile-first, breakpoint Tailwind, PWA-enabled |
| **Dukungan tema** | Light mode + Dark mode (keduanya first-class) |
| **Lokalisasi** | i18n manual via messages/{id,en}.json |
| **Deployment** | Docker (Next standalone + Caddy + Redis) |
| **ARM64** | Platform default produksi |
| **Premium** | Midtrans payment + scheduler auto-expire |

---

## 5. Batasan Produk (Saat Ini)

- ~~Belum ada notifikasi push atau reminder~~ ✅ **Sudah ada** (daily reminder via Web Push)
- ~~Belum ada integrasi bank (OCR / auto-import statement)~~ ✅ **OCR sudah ada** (scan struk via Gemini), tapi **auto-import statement bank via API** belum
- ~~Belum ada budget carry-over (sisa bulan lalu → bulan ini)~~ ✅ **Sudah ada** (toggle per kategori, rekursif)
- Belum ada widget mobile (iOS/Android) — PWA sudah, tapi widget native belum
- AI Chat bergantung pada provider eksternal (DeepSeek) — ada privacy disclosure
- Cloudflare Managed Challenge dapat memblokir akses API dari script eksternal (solusi: WAF skip rule)
- Belum ada anomaly detection (pola pengeluaran tidak wajar)
- Belum ada cash flow forecast (prediksi saldo bulan depan)
- Belum ada CSV mass import (upload file bank statement)

---

## 6. Evolusi Produk (Roadmap)

Lihat `docs/plans/PLAN.md` untuk visi awal & scope MVP.
Lihat `docs/plan-upgrade.md` untuk rencana upgrade & runbook admin.

### ✅ Sudah Terealisasi (di luar scope MVP awal)
- Push notification & daily reminder
- Budget carry-over (rekursif, per kategori)
- OCR scan struk (via Gemini Vision)
- Debt tracker (utang/piutang dengan pihak eksternal)
- Batch transaction input
- Midtrans payment integration (Premium)
- Multi-currency wallet
- Timezone auto-detect

### 🔮 Fitur Potensial ke Depan
- Integrasi bank auto-import (via API partner / scraping)
- Widget iOS/Android (home screen widget)
- Family dashboard (gabungan view semua wallet keluarga)
- Kategori AI auto-suggest
- Spending anomaly detection
- Cash flow forecast
- CSV mass import (manual upload bank statement)
- Monthly AI narrative report
- Dark mode scheduler (auto-switch theme based on schedule)
