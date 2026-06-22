---
title: Balance — Chat API Reference
version: 2.0.0
last_updated: 2026-06-22
base_url: https://mybalance.my.id
---

# Balance — API Reference

> Dokumentasi lengkap API Balance untuk integrasi AI / chatbot / eksternal.
> Base URL: `https://mybalance.my.id`

> **Tiga layer API:**
> 1. **REST API** (`/api/chat/*`) — endpoint sederhana buat baca rekap & catat transaksi
> 2. **AI Chat SSE** (`/api/ai/chat`) — streaming chat endpoint buat integrasi AI assistant
> 3. **AI Function Tools** — internal tools yang dipanggil AI model buat akses data finansial

---

## 1. Autentikasi

Semua request API harus menyertakan **API Key** via Bearer token di header `Authorization`.

```
Authorization: Bearer <api_key>
```

### Cara Mendapatkan API Key

1. Login ke Balance → Settings → API Keys
2. Klik "Generate New Key"
3. Copy key (hanya muncul sekali!)
4. Key akan di-hash SHA256 dan disimpan di database

> ⚠️ **Peringatan:** Key hanya muncul sekali saat generate. Simpan di tempat aman.
> ⚠️ **Key format:** `bal_` + 43+ karakter alfanumerik (~47 karakter total). Contoh: `bal_rok6EEF_EdPofGfHV1m-6UIci-VUMyd2ub70SnAAgUk`

### Keamanan Key

- Key di-hash SHA256 sebelum disimpan ke DB
- Key bisa di-revoke (tidak bisa dari Settings UI saat ini, perlu SQL manual)
- Tidak ada batas jumlah key per user

### Error Auth

```json
HTTP 401
{"error": "unauthorized"}
```

**Penyebab umum:**
1. Key salah / truncated (jangan pakai `...` di curl!)
2. Key sudah di-revoke
3. Key dari environment berbeda (beda user domain)

---

## 2. Rekap Keuangan

```
GET /api/chat/rekap?period=day|week|month
```

### Query Parameters

| Parameter | Wajib | Default | Nilai |
|-----------|-------|---------|-------|
| `period` | ❌ | `month` | `day`, `week`, `month` |
| `wallet_id` | ❌ | Semua wallet | Filter wallet spesifik |

### Response (200 OK)

```json
{
  "period": "month",
  "range": {
    "start": "2026-06-01T00:00:00.000Z",
    "end": "2026-06-09T23:59:59.999Z"
  },
  "wallets": ["<wallet_id_1>", "<wallet_id_2>"],
  "totalIncome": 5421979,
  "totalExpense": 947369,
  "net": 4474610,
  "transactionCount": 35,
  "categoryBreakdown": [
    { "categoryId": "<category_id>", "categoryName": "Belanja Harian", "total": 184900 }
  ],
  "perWallet": [
    {
      "walletId": "<wallet_id>",
      "walletName": "Personal",
      "totalIncome": 1021979,
      "totalExpense": 947369,
      "net": 74610,
      "transactionCount": 34
    }
  ]
}
```

### Contoh Curl

```bash
curl -s -H "Authorization: Bearer <api_key>" \
  -H "User-Agent: Mozilla/5.0 Chrome/125" \
  -H "Accept: application/json" \
  "https://mybalance.my.id/api/chat/rekap?period=day"
```

---

## 3. Input Transaksi

```
POST /api/chat/transaction
Content-Type: application/json
```

### Request Body

| Field | Wajib | Tipe | Contoh |
|-------|-------|------|--------|
| `wallet_id` | ✅ | string | `"<wallet_id>"` |
| `amount` | ✅ | number (>0) | `12000` |
| `kind` | ✅ | string | `"income"` / `"expense"` |
| `category_id` | ❌ | string? | `"<category_id>"` |
| `note` | ❌ | string? | `"Gio French fries - QRIS"` |
| `happened_at` | ❌ | string (YYYY-MM-DD) | `"2026-06-09"` (default: hari ini) |

### Response (201 Created)

```json
{
  "id": "<transaction_id>",
  "wallet_id": "<wallet_id>",
  "kind": "expense",
  "amount": 12000,
  "happened_at": "2026-06-09T00:00:00.000Z",
  "source": "manual"
}
```

### Contoh Curl

```bash
curl -s -X POST "https://mybalance.my.id/api/chat/transaction" \
  -H "Authorization: Bearer <api_key>" \
  -H "User-Agent: Mozilla/5.0 Chrome/125" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "<wallet_id>",
    "amount": 12000,
    "kind": "expense",
    "note": "Gio French fries - QRIS"
  }'
```

### Error Response

```json
HTTP 400
{"error": "wallet_id is required"}

HTTP 400
{"error": "amount must be positive"}

HTTP 400
{"error": "invalid kind, must be income or expense"}
```

---

## 4. AI Chat — Streaming Chat

```
POST /api/ai/chat
Content-Type: application/json
```

Endpoint utama untuk integrasi AI assistant ke Balance. Response berupa **SSE (Server-Sent Events)** stream.

> ⚠️ **Prasyarat:** User harus mengaktifkan AI Chat consent di Settings → AI Chat.

### Request Body

| Field | Wajib | Tipe | Deskripsi |
|-------|-------|------|-----------|
| `messages` | ✅ | `Array<{role, content, score?}>` | Riwayat chat. `role: "user"|"assistant"`, `content: string`, `score?: number` (relevansi) |
| `intent` | ❌ | `"chat"` \| `"recap"` | Default: `"chat"`. `"recap"` untuk langsung dapat ringkasan |
| `walletId` | ❌ | string | Fokus ke wallet tertentu |
| `period` | ❌ | `"day"` \| `"week"` \| `"month"` | Default: `"month"` |
| `locale` | ❌ | `"id"` \| `"en"` | Bahasa response (auto-detect dari cookie jika tidak diisi) |
| `action` | ❌ | string | Label aktivitas untuk running summary (misal: `"general"`, `"catat transaksi"`) |
| `runningSummary` | ❌ | string | Konteks ringkas dari turn sebelumnya (dapat dari event `runningSummary`) |

### SSE Event Types

Setiap event adalah `data: {...}\n\n` — baca dengan EventSource atau fetch + ReadableStream.

| Event | Payload | Kapan |
|-------|---------|-------|
| `token` | `{"type":"token","content":"..."}` | Streaming text dari AI |
| `transactionPreview` | `{"type":"transactionPreview","confidence":0.85,"preview":{...}}` | AI mendeteksi transaksi — perlu konfirmasi user |
| `runningSummary` | `{"type":"runningSummary","content":"..."}` | Ringkasan finansial kompak untuk dikirim di turn berikutnya |
| `done` | `{"type":"done"}` | Stream selesai |
| `streamTimeout` | `{"type":"streamTimeout"}` | Stream timeout (60 detik) |

### Response Codes

| Status | Arti |
|--------|------|
| 200 | SSE stream (Content-Type: `text/event-stream`) |
| 400 | Pesan kosong / tidak valid / keamanan |
| 403 | AI Chat consent belum diaktifkan |
| 429 | Rate limit / daily limit tercapai |
| 500 | Gagal load data / downstream AI error |
| 503 | AI Chat tidak tersedia (belum dikonfigurasi) |

### Contoh Curl

```bash
curl -s -N -X POST "https://mybalance.my.id/api/ai/chat" \
  -H "Authorization: Bearer <api_key>" \
  -H "User-Agent: Mozilla/5.0 Chrome/125" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Berapa pengeluaranku hari ini?"}],
    "period": "day",
    "intent": "chat"
  }'
```

---

## 5. AI Function Tools (Internal)

Tools berikut **dipanggil oleh AI model** secara internal saat memproses chat — bukan REST endpoint langsung. Catatan ini berguna bagi developer yang ingin memahami kemampuan AI Chat atau mengimplementasikan ulang function-calling layer.

### 5.1 `getFinancialRecap` — Rekap Keuangan

Ambil ringkasan finansial user untuk periode tertentu.

| Parameter | Wajib | Tipe | Deskripsi |
|-----------|-------|------|-----------|
| `period` | ✅ | `"day" \| "week" \| "month"` | Periode rekap |
| `walletId` | ❌ | string | Filter wallet spesifik |

**Response:** Sama seperti endpoint `GET /api/chat/rekap`.

---

### 5.2 `getTransactions` — Daftar Transaksi

Ambil transaksi terbaru dengan filter opsional.

| Parameter | Wajib | Tipe | Deskripsi |
|-----------|-------|------|-----------|
| `walletId` | ❌ | string | Filter wallet |
| `limit` | ❌ | number (1-50) | Jumlah transaksi (default: 10) |
| `startDate` | ❌ | string (YYYY-MM-DD) | Filter tanggal mulai |
| `endDate` | ❌ | string (YYYY-MM-DD) | Filter tanggal akhir |

**Response:** Array of transactions.

---

### 5.3 `getBudgetStatus` — Status Anggaran

Cek status anggaran bulan berjalan untuk sebuah wallet.

| Parameter | Wajib | Tipe | Deskripsi |
|-----------|-------|------|-----------|
| `walletId` | ✅ | string | ID wallet |

**Response:** Budget per kategori + sisa + persentase.

---

### 5.4 `getCategories` — Daftar Kategori

Ambil kategori yang tersedia untuk user.

| Parameter | Wajib | Tipe | Deskripsi |
|-----------|-------|------|-----------|
| `walletId` | ❌ | string | Fokus ke wallet tertentu |

**Response:** Array kategori dengan `id`, `name`, `kind`, `color`.

---

### 5.5 `createTransaction` — Catat Transaksi

Catat transaksi baru setelah user konfirmasi.

| Parameter | Wajib | Tipe | Deskripsi |
|-----------|-------|------|-----------|
| `walletId` | ✅ | string | ID wallet tujuan |
| `amount` | ✅ | number | Nominal (> 0, integer, IDR) |
| `kind` | ✅ | `"income" \| "expense"` | Jenis transaksi |
| `categoryId` | ❌ | string | ID kategori |
| `note` | ❌ | string | Catatan transaksi |
| `happenedAt` | ❌ | string (YYYY-MM-DD) | Tanggal transaksi |

**Response:** Transaction object yang baru dibuat.

---

### 5.6 `createBudget` / `updateBudget` / `deleteBudget` — CRUD Anggaran

Kelola budget per kategori per bulan.

| Tool | Param Wajib | Deskripsi |
|------|-------------|-----------|
| `createBudget` | `walletId`, `categoryId`, `amount` | Buat budget baru |
| `updateBudget` | `walletId`, `categoryId`, `amount` | Update nominal budget |
| `deleteBudget` | `walletId`, `categoryId` | Hapus budget |

> 💡 **Best practice:** AI Chat akan otomatis cek kategori dulu (`getCategories`) sebelum create/update budget.

---

## 6. Rate Limiting

- **Algoritma:** Sliding window (Redis-based)
- **Limit:** 30 request per menit per API key
- **Response saat kena limit:**

```json
HTTP 429
{"error": "rate_limit_exceeded"}
```

- **Best-effort:** Tanpa Redis, rate limit tidak aktif (semua request lolos)

---

## 7. Kategori yang Tersedia (Default)

Setiap wallet punya kategori sendiri. Contoh dari wallet Personal:

| categoryId | Nama | Kind | Warna |
|-----------|------|------|-------|
| (ID unik per wallet) | Belanja Harian | expense | #8C936D |
| | Kesehatan | expense | — |
| | Makanan | expense | — |
| | Belanja | expense | — |
| | Kopi & Nongkrong | expense | — |
| | Bensin | expense | — |
| | Langganan | expense | — |
| | Keluarga | expense | — |
| | Bonus | income | — |
| | Transport | expense | — |
| (system) | Tabungan | expense | #5d7a74 |
| (system) | Pencairan Tabungan | income | #7a9d8f |
| (system) | Penyesuaian Saldo Masuk | income | #6f8f78 |
| (system) | Penyesuaian Saldo Keluar | expense | #8e7558 |

> 💡 **System categories** otomatis dibuat oleh database trigger. Jangan dihapus.
> 💡 **ID kategori berbeda per wallet** — gunakan `getCategories` untuk mendapatkan ID yang valid.

---

## 8. Error Codes

| HTTP | Kode | Penyebab |
|------|------|----------|
| 401 | `unauthorized` | API key salah / revoked / format salah |
| 400 | `validation_error` | Field required / invalid format |
| 400 | `wallet_not_found` | wallet_id tidak ditemukan / bukan member |
| 403 | `ai_chat_consent_required` | AI Chat consent belum diaktifkan user |
| 429 | `rate_limit_exceeded` | Terlalu banyak request (30/menit) |
| 429 | `daily_limit_exceeded` | Batas chat harian tercapai (free: 3, premium: 20) |
| 500 | `internal_error` | Gagal load data / Supabase error / downstream AI failure |
| 503 | `ai_chat_unavailable` | AI Chat tidak dikonfigurasi (API key missing) |
| — | Cloudflare (403) | Managed Challenge — perlu WAF skip rule |

### AI Chat Specific Errors (via SSE)

| Event | Arti |
|-------|------|
| `transactionPreview` | Transaksi terdeteksi tapi butuh konfirmasi user |
| `streamTimeout` | Streaming timeout setelah 60 detik |

---

## 9. ⚠️ Cloudflare Setup

Server Balance ada di belakang **Cloudflare**. Dari environment Docker / server headless:

- `curl` biasa → 403 (JS challenge)
- `cloudscraper` → 403
- Playwright Chromium → timeout

### Solusi WAF Rule

1. Dashboard Cloudflare → Security → WAF → Custom Rules
2. Create rule:
   - Name: `Skip challenge for Balance API`
   - Field: `URI Path` → **starts with** → `/api/`
   - Then: **Skip** → check **"Managed Challenge"**
3. Simpan di priority tertinggi

### Alternatif (Free Plan): Page Rule

1. Rules → Page Rules → Create Page Rule
2. URL: `mybalance.my.id/api/*`
3. Pick: **Security Level → Essentially Off**

### Penting: User-Agent Header

Semua request ke API harus menyertakan `User-Agent` header. Contoh:

```
User-Agent: Mozilla/5.0 Chrome/125
```

Tanpa User-Agent, Cloudflare bisa memblokir request sebagai bot.

---

## 10. Best Practices & Limitations

### Rate Limit & Cache
- **30 req/min** per API key — handle `429` dengan exponential backoff
- Data rekap di-cache **30 detik** (Redis) — jangan spam
- AI Chat daily limit: **3 chat/hari** (free), **20 chat/hari** (premium), **∞** (premium dengan plan tinggi)

### Format Data
- **Semua nominal dalam IDR, integer, tanpa desimal**
- Timezone: **WIB (UTC+7)** kecuali disebut lain
- Tanggal: **ISO 8601** (`YYYY-MM-DD` atau `YYYY-MM-DDTHH:mm:ss.sssZ`)

### API Key
- Per-user, bukan per-wallet
- Prefix: `bal_` (total ~47 karakter)
- Key di-hash SHA256 sebelum disimpan
- **Simpan setelah generate — hanya muncul sekali!**
- Revoke via SQL manual (belum ada UI)

### AI Chat
- WAJIB: user harus mengaktifkan AI Chat consent di Settings
- WAJIB: siapkan API key upstream (Sumopod) di server
- SSE membutuhkan client yang support stream (fetch + ReadableStream, bukan EventSource biasa untuk POST)
- `runningSummary` memungkinkan percakapan multi-turn yang efisien

### Cloudflare
- Semua endpoint `/api/*` butuh WAF skip rule + User-Agent header
- Tanpa itu, request dari server headless akan kena 403 JS challenge

---

## 11. Integration Examples

### 11.1 Curl — Rekap Harian

```bash
curl -s -H "Authorization: Bearer <api_key>" \
  -H "User-Agent: Mozilla/5.0 Chrome/125" \
  "https://mybalance.my.id/api/chat/rekap?period=day"
```

### 11.2 Curl — Catat Transaksi

```bash
curl -s -X POST "https://mybalance.my.id/api/chat/transaction" \
  -H "Authorization: Bearer <api_key>" \
  -H "User-Agent: Mozilla/5.0 Chrome/125" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "<wallet_id>",
    "amount": 50000,
    "kind": "expense",
    "category_id": "<category_id>",
    "note": "Makan siang"
  }'
```

### 11.3 Curl — AI Chat (SSE)

```bash
curl -s -N -X POST "https://mybalance.my.id/api/ai/chat" \
  -H "Authorization: Bearer <api_key>" \
  -H "User-Agent: Mozilla/5.0 Chrome/125" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Berapa pengeluaranku hari ini?"}],
    "period": "day"
  }'
```

### 11.4 Node.js — AI Chat SSE Consumer

```javascript
const response = await fetch("https://mybalance.my.id/api/ai/chat", {
  method: "POST",
  headers: {
    Authorization: "Bearer <api_key>",
    "Content-Type": "application/json",
    "User-Agent": "BalanceBot/1.0"
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Cek pemasukan bulan ini" }],
    period: "month"
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      const event = JSON.parse(line.slice(6));
      if (event.type === "token") process.stdout.write(event.content);
      if (event.type === "done") console.log("\n✅ Done");
    }
  }
}
```

### 11.5 Python — AI Chat SSE Consumer

```python
import httpx, json

with httpx.Client() as client:
    response = client.post(
        "https://mybalance.my.id/api/ai/chat",
        headers={
            "Authorization": "Bearer <api_key>",
            "Content-Type": "application/json",
            "User-Agent": "BalanceBot/1.0"
        },
        json={
            "messages": [{"role": "user", "content": "Berapa pengeluaranku?"}],
            "period": "month"
        }
    )
    for line in response.iter_lines():
        if line.startswith("data: "):
            event = json.loads(line[6:])
            if event["type"] == "token":
                print(event["content"], end="", flush=True)
            elif event["type"] == "done":
                print()
                break
```

### 11.6 Hermes Agent — Skill Configuration

Untuk menghubungkan Hermes Agent ke Balance API, gunakan `balance-api` skill dengan konfigurasi:

```bash
# Set API key di .env
echo "BALANCE_API_KEY=<api_key>" >> .env
echo "BALANCE_BASE_URL=https://mybalance.my.id" >> .env
```

Kemudian di skill, gunakan `terminal` (curl) atau `web_extract` untuk akses REST API, dan `execute_code` + `httpx` untuk AI Chat SSE stream.

---

## 12. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-06-22 | Base URL update → mybalance.my.id, added AI Chat SSE endpoint, AI Function Tools reference, integration examples, best practices |
| 1.1.0 | 2026-06-17 | Added categories reference, rate limiting, Wallet IDs |
| 1.0.0 | — | Initial release
