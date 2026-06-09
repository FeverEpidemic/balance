---
title: Balance — Chat API Reference
version: 1.0.0
last_updated: 2026-06-09
base_url: https://finance.acknowledge.my.id
---

# Balance — Chat API Reference

> Dokumentasi lengkap API Chat Balance untuk integrasi AI / chatbot / eksternal.
> Base URL: `https://finance.acknowledge.my.id`

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
  "wallets": [
    "5822565b-0dc1-4a64-9caf-43f49c837415",
    "a7ad5881-2109-4cd9-98ff-f8e0c1be795d"
  ],
  "totalIncome": 5421979,
  "totalExpense": 947369,
  "net": 4474610,
  "transactionCount": 35,
  "categoryBreakdown": [
    {
      "categoryId": "8780b523-...",
      "categoryName": "Belanja Harian",
      "total": 184900
    },
    {
      "categoryId": "350277a4-...",
      "categoryName": "Kesehatan",
      "total": 180000
    }
  ],
  "perWallet": [
    {
      "walletId": "5822565b-...",
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
curl -s -H "Authorization: Bearer bal_rok6EEF_..." \
  -H "User-Agent: Mozilla/5.0 Chrome/125" \
  -H "Accept: application/json" \
  "https://finance.acknowledge.my.id/api/chat/rekap?period=day"
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
| `wallet_id` | ✅ | string | `"5822565b-0dc1-4a64-9caf-43f49c837415"` |
| `amount` | ✅ | number (>0) | `12000` |
| `kind` | ✅ | string | `"income"` / `"expense"` |
| `category_id` | ❌ | string? | `"3bd9b5e3-c987-4ee9-ac8e-e21b32d3d886"` |
| `note` | ❌ | string? | `"Gio French fries - QRIS"` |
| `happened_at` | ❌ | string (YYYY-MM-DD) | `"2026-06-09"` (default: hari ini) |

### Response (201 Created)

```json
{
  "id": "6ab61699-d8c6-4ec0-9e9a-51bb0d364860",
  "wallet_id": "5822565b-0dc1-4a64-9caf-43f49c837415",
  "kind": "expense",
  "amount": 12000,
  "happened_at": "2026-06-09T00:00:00.000Z",
  "source": "manual"
}
```

### Contoh Curl

```bash
curl -s -X POST "https://finance.acknowledge.my.id/api/chat/transaction" \
  -H "Authorization: Bearer bal_rok6EEF_..." \
  -H "User-Agent: Mozilla/5.0 Chrome/125" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "5822565b-0dc1-4a64-9caf-43f49c837415",
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

## 4. Rate Limiting

- **Algoritma:** Sliding window (Redis-based)
- **Limit:** 30 request per menit per API key
- **Response saat kena limit:**

```json
HTTP 429
{"error": "rate_limit_exceeded"}
```

- **Best-effort:** Tanpa Redis, rate limit tidak aktif (semua request lolos)

---

## 5. Kategori yang Tersedia (Default)

Setiap wallet punya kategori sendiri. Berikut kategori yang biasa muncul (contoh dari wallet Personal):

| categoryId | Nama | Kind | Warna |
|-----------|------|------|-------|
| `8780b523-...` | Belanja Harian | expense | #8C936D |
| `350277a4-...` | Kesehatan | expense | #... |
| `3bd9b5e3-...` | Makanan | expense | #... |
| `02ce015d-...` | Belanja | expense | #... |
| `9400c6d9-...` | Kopi & Nongkrong | expense | #... |
| `ec806208-...` | Bensin | expense | #... |
| `aaed9ca1-...` | Langganan | expense | #... |
| `841e2655-...` | Keluarga | expense | #... |
| `a8282b7b-...` | Bonus | income | #... |
| `97770879-...` | Transport | expense | #... |
| (system) | Tabungan | expense | #5d7a74 |
| (system) | Pencairan Tabungan | income | #7a9d8f |
| (system) | Penyesuaian Saldo Masuk | income | #6f8f78 |
| (system) | Penyesuaian Saldo Keluar | expense | #8e7558 |

> 💡 **System categories** (Tabungan, Pencairan Tabungan, Penyesuaian Saldo) otomatis dibuat oleh database trigger. Jangan dihapus.

---

## 6. Error Codes

| HTTP | Kode | Penyebab |
|------|------|----------|
| 401 | `unauthorized` | API key salah / revoked / format salah |
| 400 | `validation_error` | Field required / invalid format |
| 400 | `wallet_not_found` | wallet_id tidak ditemukan / bukan member |
| 429 | `rate_limit_exceeded` | Terlalu banyak request |
| 403 | Cloudflare | Managed Challenge — perlu WAF skip rule |

---

## 7. ⚠️ Cloudflare Issue

Server Balance ada di belakang **Cloudflare Managed Challenge**. Dari environment Docker / server headless:

- `curl` biasa → 403 (JS challenge)
- `cloudscraper` → 403
- Playwright Chromium → timeout

**Solusi:** Konfigurasi Cloudflare WAF:
1. Dashboard Cloudflare → Security → WAF → Custom Rules
2. Create rule:
   - Name: `Skip challenge for Balance API`
   - Field: `URI Path` → **starts with** → `/api/`
   - Then: **Skip** → check **"Managed Challenge"**
3. Simpan di priority tertinggi

**Alternatif (Free plan):** Rules → Page Rules → Create Page Rule
- URL: `acknowledge.my.id/api/*`
- Pick: **Security Level → Essentially Off**

---

## 8. Wallet IDs (Reference)

Wallet yang tersedia di akun Ilham (FeverEpidemic):

| Wallet Name | Wallet ID |
|-------------|-----------|
| Personal | `5822565b-0dc1-4a64-9caf-43f49c837415` |
| Kartu Kredit | `a7ad5881-2109-4cd9-98ff-f8e0c1be795d` |
