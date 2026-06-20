# OCR Receipt Scanner — Implementation Plan (v2)

> **For Hermes:** Use `subagent-driven-development` skill to implement this plan task-by-task with two-stage review.

**Goal:** Add a "Scan Receipt" camera/file-upload button to the transaction create form. Users snap a photo of a receipt or email screenshot, and the app auto-fills all transaction fields (amount, category, date, note, kind) via vision AI. User confirms or edits before saving.

**Architecture:** New server-side API endpoint (`POST /api/ai/ocr-scan`) that accepts a base64 image, calls a vision LLM (Gemini 3.1 Flash Lite via Sumopod OpenAI-compatible API) to extract structured transaction details, and returns a JSON object that the existing transaction create form consumes to pre-fill its fields. The vision client is a separate `OpenAI` instance with its own env vars — it does NOT interfere with the existing DeepSeek AI chat client.

**Tech Stack:** Next.js App Router, TypeScript, React (client component), OpenAI SDK (reused), Sumopod (ai.sumopod.com/v1) as vision proxy, Gemini 3.1 Flash Lite.

---

## Current Architecture (what we're extending)

```
User types in Chat → POST /api/ai/chat → DeepSeek → SSE stream → transactionPreview → confirm
User fills form      → ActionForm → createTransaction (server action) → Supabase insert

NEW:
User snaps receipt   → POST /api/ai/ocr-scan → Gemini Vision → JSON → pre-fill form → user saves
```

The existing AI chat already does text-based transaction extraction (via tool calls + confidence tiers). This OCR feature is a **separate code path** that bypasses the chat entirely — it directly uses the vision model to parse images, then feeds results into the existing manual transaction form.

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate vision client from chat | Chat uses DeepSeek; OCR uses Gemini. Different models, base URLs, keys. No coupling. |
| Direct API call (not server action) | Server actions don't support multipart/form-data natively in Next.js 15. Route handler handles uploads properly. |
| Return JSON, not SSE | Single request-response. Simpler, no streaming overhead. |
| Auto-fill existing form | Reuses all existing validation, error handling, and UX. No duplicate form logic. |
| `capture="environment"` | Opens rear camera on mobile by default — user is scanning physical receipt. |
| Two buttons: camera + gallery | Camera for live photo, gallery for existing screenshots. More flexible UX. |
| No separate OCR page | Keeps feature where users already create transactions — low friction, discoverable. |
| Compress before upload | Resize large camera photos client-side to reduce bandwidth + API costs. |
| Zero-persist images | Image data processed in-memory only, never written to disk or DB. Cleared after response. |
| No image in logs | console.error only logs error message, never image/payload. |

---

## 🎯 Free vs Premium Tiering

| Plan | Daily OCR scan limit | Reason |
|------|---------------------|--------|
| **Free** | **3 scans/day** | Let them try the feature (conversion hook) |
| **Premium** | **20 scans/day** | Covers 99.9% real usage — gap 7× from free feels worth upgrading |
| **Self-hosted** | **Unlimited** (null) | Always unlocked |

**Implementation:** Extend `PlanPolicy` with `ocrScanDailyLimit: number | null`. Reuse `consumeAiChatDailyLimit` pattern in `lib/rate-limit.ts` — add `consumeOcrDailyLimit(userId)` with its own Redis key prefix so counters don't overlap.

Free users who hit the limit see: *"Kamu sudah mencapai batas scan hari ini. Upgrade ke Premium untuk scan unlimited."* with a link to the pricing page.

**Per-minute rate limit (abuse prevention):** Reuse existing `consumeAiChatRateLimit` pattern. Add `consumeOcrRateLimit(userId)` — 1 scan per 10 seconds max for all plans. Protects API budget from accidental spam / rapid retries. Returns 429 with retry-after header.

---

## 🔐 Privacy & Data Retention

**Core principle: zero-persist.** Images are never written to disk, database, or any persistent storage.

| Stage | What happens | Data stored? |
|-------|-------------|--------------|
| User snaps receipt | File stays on device | ❌ |
| Upload to API | base64 in request body (in-memory) | ❌ cleared after request |
| Server processing | Buffer.from(arrayBuffer) — in-memory | ❌ GC'd after response |
| Sent to Gemini Vision | data URL via OpenAI SDK | ❌ standard API, no logging |
| Response to client | JSON only (amount, category, etc.) | ✅ only structured data |
| User confirms | Transaction saved to Supabase | ✅ transaction record |

**Logging policy:** `console.error("[ocr-scan] Error:", message)` — logs ONLY the error message string, never the image payload or base64 data. No `console.log(imageBase64)` anywhere.

**Scan success monitoring:** Log `[ocr-scan] status=<success|failed|limit_hit> user=<id> duration=<ms>` on each scan. This enables tracking:
- Success rate over time
- Average response time (Gemini latency)
- Daily limit hit frequency per free user (signal for conversion friction)

---

## 🗂️ Category Matching: Fuzzy Fallback

Problem: Gemini might return different text than what's in the user's category list (e.g., `"Belanja"` vs `"Belanja Harian"`, `"Makan"` vs `"Makanan"`).

**Solution:** Use case-insensitive prefix matching and a small synonym map:

```typescript
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "Makanan": ["makan", "makanan", "resto", "restoran", "warung", "makan siang", "dinner", "lunch"],
  "Belanja Harian": ["belanja", "belanja harian", "minimarket", "supermarket", "indomaret", "alfamart", "alfamidi", "sembako"],
  "Kopi & Nongkrong": ["kopi", "kafe", "cafe", "nongkrong", "coffee", "boba"],
  // ... etc for all categories
};
```

Match logic:
1. Try exact match (case-insensitive) → use it
2. Try synonym map → use mapped category
3. Try prefix match (e.g., "Belanja" → "Belanja Harian") → use closest
4. Fallback: `"Lainnya"` → user picks manually

---

## 📸 Image Format Handling

**Problem:** iPhone captures in HEIC (`.heic`), which Gemini Vision may not handle well.

**Solution:** Client-side preprocessing before upload:
- Accept `image/*` (covers HEIC, JPEG, PNG, WebP)
- Use `canvas` to resize + convert to JPEG:
  - Max dimension: 1920px (reduces bandwidth + API cost)
  - Output format: JPEG (most compatible)
  - Quality: 0.8 (good enough for OCR, much smaller)
- This also reduces payload size → faster uploads + cheaper API calls

```typescript
async function compressImage(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const maxDim = 1920;
  // ... resize logic ...
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), "image/jpeg", 0.8));
}
```

---

## ⏱️ Timeout & Retry UX

Vision API calls can take 2-10 seconds depending on network and image size.

| State | UI | Behaviour |
|-------|-----|-----------|
| **Idle** | Button "📷 Pindai Struk" | Tappable |
| **Processing** | Button → spinner "Memproses..." | Disabled, shows estimated time |
| **Success** | Confirmation card appears | Preview amount + kategori, "Pakai" or "✕" |
| **Error (API)** | Toast error | "Gagal memindai, coba lagi" + retry button |
| **Error (network)** | Toast error | "Koneksi terputus, periksa internet" + retry |
| **Timeout (15s)** | Toast error | "Terlalu lama, foto mungkin kurang jelas" + retry |
| **Daily limit hit** | Toast + upsell | "Batas scan hari ini tercapai. Upgrade Premium" |

**Retry:** Button stays functional after error — user can tap again without page reload.

**Client-side timeout:** `AbortController` with 20s timeout on the fetch call.

---

## 💰 Biaya API Estimate

Gemini 3.1 Flash Lite via Sumopod: ~$0.04/1M input tokens.

Per scan:
- Image tokens: ~258 tokens (1920px JPEG, auto-detail)
- Output tokens: ~100 tokens (JSON response)
- Cost per scan: **~$0.00001** (~Rp150 per 1000 scans)

**At free tier (3 scans/day × 30 days):** ~$0.0009/user/month — negligible.
**At 100 free users:** ~$0.09/month — essentially free.
**Buffer:** Set `VISION_DAILY_BUDGET_CENTS` if needed (optional).

---

## 🧪 Testing: Struk Indonesia

Must test with real Indonesian receipt formats:

- [ ] Indomaret / Alfamart struk belanja
- [ ] QRIS payment confirmation (GoPay, OVO, ShopeePay, DANA)
- [ ] Mobile BCA / Mandiri / BRI transfer receipt
- [ ] Email notification (Shopee, Tokopedia, Gojek)
- [ ] GoFood / GrabFood order receipt
- [ ] Bensin SPBU receipt
- [ ] Air/Listrik PDAM/PLN payment confirmation

---

## Task Breakdown

### Task 1: Add Vision API env vars to `lib/env.ts`

**Objective:** Expose Vision AI configuration through environment variables.

**Files:**
- Modify: `lib/env.ts`

**What to add:**
```typescript
export function getVisionModel(): string {
  return process.env.VISION_MODEL?.trim() || "gemini/gemini-3.1-flash-lite";
}
export function getVisionBaseUrl(): string {
  return process.env.VISION_BASE_URL?.trim() || "https://ai.sumopod.com/v1";
}
export function getVisionApiKey(): string | null {
  return process.env.VISION_API_KEY?.trim() || null;
}
export function getVisionEnabled(): boolean {
  const flag = process.env.VISION_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return Boolean(getVisionApiKey());
}
```

---

### Task 2: Add OCR daily limit to plan policy + rate limiter

**Objective:** Free users get 3 OCR scans/day; premium/self-hosted get unlimited.

**Files:**
- Modify: `lib/plan.ts` — add `ocrScanDailyLimit: number | null` to `PlanPolicy`
- Modify: `lib/rate-limit.ts` — add `consumeOcrDailyLimit(userId)` (mirror `consumeAiChatDailyLimit`)

**PlanPolicy changes:**
```typescript
export type PlanPolicy = {
  planType: PlanType;
  trialMeta: TrialMeta;
  aiChatDailyLimit: number | null;
  aiChatRateLimitMaxRequests: number;
  ocrScanDailyLimit: number | null;   // NEW: null = unlimited (premium/self-hosted)
  apiEndpointsBypassPlanLimits: true;
};

const FREE_POLICY = {
  planType: "free",
  aiChatDailyLimit: getAiChatDailyLimitMax(),
  aiChatRateLimitMaxRequests: getAiChatRateLimitMaxRequests(),
  ocrScanDailyLimit: 3,               // NEW: free = 3 scans/day
  apiEndpointsBypassPlanLimits: true
};

const PREMIUM_POLICY = {
  planType: "premium",
  aiChatDailyLimit: null,
  aiChatRateLimitMaxRequests: getAiChatRateLimitMaxRequests() * 3,
  ocrScanDailyLimit: 20,              // Premium = 20 scans/day (covers 99.9% usage)
  apiEndpointsBypassPlanLimits: true
};
```

**Rate limiter (in `lib/rate-limit.ts`):**
```typescript
const OCR_DAILY_KEY_PREFIX = "ocr:daily";
export async function consumeOcrDailyLimit(userId: string, now?: number) {
  // Same logic as consumeAiChatDailyLimit but with OCR_DAILY_KEY_PREFIX
}
```

**Env var:** Optional `VISION_DAILY_LIMIT_FREE` (default 3).

---

### Task 3: Create Vision AI client (`lib/ai/vision-client.ts`)

**Objective:** Create a dedicated OpenAI client for vision API calls — completely separate from the chat AI client.

**Files:**
- Create: `lib/ai/vision-client.ts`

(Dedicated client to avoid any env var collision with DeepSeek chat.)

---

### Task 4: Create OCR prompt and parser (`lib/ai/ocr-prompt.ts`)

**Objective:** Build the system prompt for the vision LLM and a parser that converts the LLM's response into structured transaction fields.

**Files:**
- Create: `lib/ai/ocr-prompt.ts`

**Key additions vs v1 plan:**
- Prompt now includes category synonym hints
- Parser returns `null` cleanly for malformed responses
- No image data ever logged

---

### Task 5: Create OCR API endpoint (`app/api/ai/ocr-scan/route.ts`)

**Objective:** Create the POST endpoint that receives an image, calls the vision LLM, and returns structured transaction data.

**Files:**
- Create: `app/api/ai/ocr-scan/route.ts`

**Key additions vs v1 plan:**
- Plan check: verify user's plan allows OCR scanning
- Daily limit check using `consumeOcrDailyLimit`
- Per-minute rate limit check using `consumeOcrRateLimit` (1 scan per 10 seconds)
- Monitor logging: `[ocr-scan] status=<success|failed|limit_hit|rate_limited> user=<id> duration=<ms>`
- Clear `imageBase64` variable after use (`imageBase64 = ""`)
- Proper error responses: daily limit (429), rate limit (429 + Retry-After header)
- 20s fetch timeout with AbortController
- `export const maxDuration = 30`

---

### Task 6: Create `ScanReceiptButton` client component

**Objective:** Create the camera/file-picker button that captures an image, compresses it, calls the OCR endpoint, and returns extracted transaction data.

**Files:**
- Create: `components/features/transactions/scan-receipt-button.tsx`

**Key additions vs v1 plan:**
- **Two buttons:** 📷 Pindai Struk (camera with `capture="environment"`) + 🖼️ Upload dari Galeri (file picker without capture)
- Client-side image compression (resize to 1920px max, JPEG q0.8)
- 20s AbortController timeout with user-friendly retry
- Error state with retry — distinct toasts for: API failure, network error, timeout, daily limit hit, rate limited
- Loading states: "Mengompresi gambar..." → "Memproses..."
- Toast messages in Bahasa Indonesia

---

### Task 7: Integrate scan button into `TransactionCreateForm`

**Objective:** Wire the scan button into the existing transaction create form so OCR results auto-fill the fields.

**Files:**
- Modify: `components/features/transactions/transaction-create-form.tsx`

**Key additions vs v1 plan:**
- Category fuzzy matching using synonym map
- Confirmation card shows amount + merchant + category
- User can edit before applying

---

### Task 8: Add `forwardRef` support to `ActionForm` (if missing)

**Objective:** Ensure `ActionForm` passes a ref to the underlying `<form>` element so we can auto-fill fields programmatically.

**Files:**
- Check: `components/ui/action-form.tsx`

---

### Task 9: Add env vars to `.env.example` and `README.md`

**Objective:** Document the new environment variables.

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

```bash
# ── Vision / OCR (for receipt scanning) ────────────────────────────
# Using Sumopod proxy with Gemini 3.1 Flash Lite
# Leave blank to disable receipt scanning
VISION_ENABLED=true
VISION_API_KEY=sk-you...-key
VISION_BASE_URL=https://ai.sumopod.com/v1
VISION_MODEL=gemini/gemini-3.1-flash-lite
# Optional: daily scan limit for free users (default 3)
VISION_DAILY_LIMIT_FREE=3
```

---

## Summary

| # | Task | Files | New? | Plan-aware? |
|---|------|-------|------|-------------|
| 1 | Env vars | `lib/env.ts` | Modify | — |
| 2 | Plan + rate limit | `lib/plan.ts`, `lib/rate-limit.ts` | Modify | ✅ Yes |
| 3 | Vision client | `lib/ai/vision-client.ts` | **NEW** | — |
| 4 | OCR prompt + parser | `lib/ai/ocr-prompt.ts` | **NEW** | — |
| 5 | API endpoint | `app/api/ai/ocr-scan/route.ts` | **NEW** | ✅ Checks plan |
| 6 | Scan button + compress | `components/features/transactions/scan-receipt-button.tsx` | **NEW** | — |
| 7 | Form integration + fuzzy match | `components/features/transactions/transaction-create-form.tsx` | Modify | — |
| 8 | ActionForm ref | `components/ui/action-form.tsx` | Conditional | — |
| 9 | Docs | `.env.example`, `README.md` | Modify | — |
| 10 | **Deploy** | VPS: pull image + restart compose | Manual after CI | — |
| ← | **New in v2** | **Camera + Gallery buttons** | **Task 6** | — |
| ← | **New in v2** | **Per-minute rate limit (1/10s)** | **Task 2 + 5** | ✅ All plans |
| ← | **New in v2** | **Scan success monitoring logs** | **Task 5** | — |

**Total:** 4 new files, 3-5 modified.

---

## Deployment Workflow

After all tasks are implemented and pushed:

1. **Push to `main`** → triggers:
   - GitHub Actions **CI** (lint + typecheck + test)
   - GitHub Actions **Docker Publish** (build multi-arch image + push to Docker Hub)
2. **Wait for CI green + Docker Publish success**
3. **VPS deploy:**
   ```bash
   ssh balance-vps "cd ~/balance && docker compose pull app && docker compose up -d app scheduler"
   ```
4. **Verify:** Hit `https://mybalance.my.id/id/login` → callback URL should use `mybalance.my.id`, not localhost.

---

## Pitfalls to Watch

- **HEIC on iOS:** Client-side canvas compression converts to JPEG — handles HEIC transparently ✅
- **Category mismatch:** Synonym map + fuzzy match prevents `"Belanja"` → not found
- **Base64 size + timeout:** 5MB file cap + 1920px client resize + 20s AbortController + `maxDuration = 30`
- **Dark mode:** Confirmation chip uses theme tokens — verify in both themes
- **iOS Safari camera:** `capture="environment"` works on iOS; Android may show camera+gallery — acceptable
- **JSON parsing:** Gemini sometimes wraps JSON in markdown fences — parser handles it
- **Log leakage:** No image data in logs; `console.error` only error message

---

## Verification Checklist

- [ ] Free user (<3 scans today) → scan succeeds, counter increments
- [ ] Free user (≥3 scans today) → returns 429 with upsell message
- [ ] Premium user → unlimited scans
- [ ] Rapid scan (2nd scan within 10s) → rate limited 429 with Retry-After
- [ ] `VISION_ENABLED=false` → button hidden, endpoint 503
- [ ] No API key → button hidden, graceful degradation
- [ ] Upload iPhone HEIC photo → auto-converted, scan works
- [ ] Upload BCA email screenshot → fields auto-filled with correct amount + date + merchant
- [ ] Upload QRIS receipt → category matches "Belanja Harian" or similar
- [ ] Upload blurry photo → friendly error "Foto kurang jelas, coba lagi"
- [ ] Click "Pakai" → form populated, user edits, saves → transaction in DB
- [ ] Click ✕ → confirmation dismissed, form unchanged
- [ ] Retry after error → button works without page reload
- [ ] Both light and dark themes render confirmation card correctly
- [ ] Server logs contain NO base64 image data
- [ ] `imageBase64` variable cleared after each request
