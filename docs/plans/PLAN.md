---
title: Balance — Product Plan & Roadmap
version: 1.0.0
last_updated: 2026-06-17
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
- Budget per kategori per bulan
- Tabungan (deposit/withdraw + auto transaction)
- Transaksi berulang (recurring scheduler)
- Dashboard + chart pengeluaran harian
- AI Chat (DeepSeek) — rekap, insight, pencatatan transaksi via natural language
- API Chat (rekap + input transaksi via API key)
- PWA (offline support, install prompt)
- Export Excel transaksi + PDF laporan
- Multi-currency wallet
- Free trial 7 hari + plan Free/Premium
- 2 tema (Light/Dark), 2 bahasa (id/en)
- Timezone auto-detect

---

## 3. Upgrade Plan

Lihat [`docs/plan-upgrade.md`](../plan-upgrade.md) untuk runbook admin upgrade/downgrade plan user.

---

## 4. Roadmap Fitur Potensial

- Integrasi bank (OCR / auto-import statement)
- Budget carry-over (sisa budget bulan lalu → bulan ini)
- Notifikasi push (pengingat tagihan, budget warning)
- Widget iOS/Android
- Family dashboard (gabungan view semua family wallet)
- Kategori AI auto-suggest
- Dark mode scheduler (theme-aware dengan jadwal)
