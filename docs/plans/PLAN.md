---
title: Balance — Product Plan & Roadmap
version: 1.1.0
last_updated: 2026-06-22
---

# Balance — Product Plan

> Visi produk, scope MVP (sudah direalisasikan), dan roadmap ke depan.

---

## 1. Visi

Balance adalah personal & household finance tracker untuk pengguna Indonesia — cepat, mobile-first, aman (RLS-based), dan didukung AI.

---

## 2. MVP — ✅ Sudah Direalisasikan

Lihat [`docs/PRD.md`](../PRD.md) untuk daftar fitur lengkap. Semua fitur core sudah selesai:

- Autentikasi + OAuth Google
- Wallet personal & shared (invitation, role-based access)
- Transaksi (CRUD, split bill, settlement)
- Budget per kategori per bulan + carry-over toggle
- Tabungan (deposit/withdraw + auto transaction)
- Transaksi berulang (recurring scheduler)
- Dashboard + chart pengeluaran harian + Available Budget card
- AI Chat (DeepSeek) — rekap, insight, pencatatan transaksi via natural language
- API Chat (rekap + input transaksi via API key)
- PWA (offline support, install prompt, background sync)
- Export Excel transaksi + PDF laporan (premium)
- Multi-currency wallet
- Free trial 7 hari + plan Free/Premium
- 2 tema (Light/Dark), 2 bahasa (id/en)
- Timezone auto-detect
- Push notification & daily reminder
- OCR scan struk (via Gemini Vision)
- Debt tracker (utang/piutang eksternal)
- Batch transaction input
- Midtrans payment integration (Premium)

---

## 3. Upgrade Plan

Lihat [`docs/plan-upgrade.md`](../plan-upgrade.md) untuk runbook admin upgrade/downgrade plan user.

---

## 4. Roadmap Fitur

### 🥇 Prioritas Selanjutnya

| # | Fitur | Kategori | Effort |
|---|-------|----------|--------|
| 1 | **Weekly/Monthly Digest (Email)** — rekap pengeluaran periodik via email, engagement tanpa effort | Retention | Rendah |
| 2 | **Monthly AI Narrative Report** — laporan naratif otomatis "Bulan ini pengeluaran naik 20% karena..." | AI / Konten | Sedang |
| 3 | **Spending Anomaly Detection** — notifikasi kalau pola pengeluaran tiba-tiba melonjak tidak wajar | AI Intelligence | Sedang |

### 🗺️ Jangka Panjang

- Integrasi bank auto-import (via API partner / scraping)
- Widget iOS/Android (home screen widget)
- Family dashboard (gabungan view semua family wallet)
- Kategori AI auto-suggest
- Cash flow forecast (prediksi saldo bulan depan)
- CSV mass import (upload bank statement)
- Dark mode scheduler (theme-aware dengan jadwal)
