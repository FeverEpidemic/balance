# Hermes ↔ Balance Integration Guide — Implementation Plan

> **For Hermes:** Write the plan only — do not execute.

**Goal:** Create a user-facing guide (`docs/HERMES_INTEGRATION.md` or as a blog article) that explains how Balance users can connect their account to Hermes Agent and use it as a personal finance AI assistant.

**Audience:** Balance users who want AI-powered finance tracking — tech-savvy but not necessarily developers. Bahasa Indonesia.

**Existing Context:**
- Balance sudah punya AI Chat internal (in-app)
- Hermes Agent adalah external AI agent yang bisa konek via Balance API
- Ada `docs/API_REFERENCE.md` (API technical reference)
- Ada `balance-api` skill (for Hermes agents)
- Yang kurang: **panduan dari sisi user** — "gimana cara setup Hermes buat Balance?"

---

## Proposed Content Outline

### 1. Overview
- What is Hermes Agent? (1 paragraph, casual)
- What can it do with Balance? (rekap, catat transaksi, tanya pengeluaran, dll)
- Who is this for? (power users yang mau AI assistant di luar app)

### 2. Prerequisites
- Akun Balance (free sudah cukup)
- API Key dari Settings → API Keys
- Hermes Agent terinstall (link ke hermes-agent.nousresearch.com)
- Cloudflare WAF rule configured (link ke API_REFERENCE.md)

### 3. Step-by-Step: Connect Hermes to Balance
- Step 1: Generate API Key di Balance
- Step 2: Install Hermes Agent (satu command)
- Step 3: Set API key di Hermes `.env`
- Step 4: Test koneksi (curl contoh)
- Step 5: Install balance-api skill
- Step 6: Mulai chat dengan Hermes

### 4. What You Can Do (Use Cases)
- "Berapa pengeluaranku hari ini?"
- "Catat pengeluaran 50rb untuk makan siang"
- "Rekap pengeluaran bulan ini"
- "Cek sisa budget"
- "Kirim remindeer tiap jam 8 malem buat catat pengeluaran"

### 5. Cron Job Examples
- Daily reminder buat catat transaksi
- Weekly rekap otomatis
- Monthly budget check

### 6. Troubleshooting
- API Key 401 error
- Cloudflare 403
- Hermes gak bisa akses Balance
- Rate limited

### 7. Security Notes
- API Key cuma sekali muncul
- Key hashed di database
- Hermes skill cuma bisa akses wallet user sendiri
- Recommended: restrict Telegram bot ke chat ID sendiri

---

## Implementation Plan

### Task 1: Create `docs/HERMES_INTEGRATION.md`
Write the full guide with:
- Casual Bahasa Indonesia tone
- Step-by-step instructions with screenshots (placeholder for actual screenshots)
- Copy-pasteable commands
- Links to external resources (Hermes docs, API reference)

**Files:**
- Create: `docs/HERMES_INTEGRATION.md` (~200-300 lines)

### Task 2: Create blog article (optional)
Adapt the guide as a Ghost blog post at blog.mybalance.my.id for SEO + marketing.

**Files:**
- Post to Ghost Admin API as draft

### Task 3: Link from Balance app (optional)
- Add "Connect with Hermes" link in Settings page
- Atau link from sidebar footer

---

## Open Questions for User

1. **Tone:** Casual "lu-gue" atau formal "Anda"? Atau mix?
2. **Audience:** Hermes beginner yang belum pernah pake, atau developer yang udah familiar?
3. **Include screenshots?** Perlu di-screenshot tiap langkah (API key generation, Hermes setup, etc)?
4. **Post as blog article juga?** Atau cukup doc di repo?
5. **Cron use case:** Udah punya use case spesifik yang mau ditonjolin? (reminder harian, weekly rekap, dll)
