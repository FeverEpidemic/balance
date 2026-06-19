# OCR Receipt Scanner — Implementation Plan

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

## Task Breakdown

### Task 1: Add Vision API env vars to `lib/env.ts`

**Objective:** Expose Vision AI configuration through environment variables.

**Files:**
- Modify: `lib/env.ts`

**Step 1: Add new env getter functions**

Add these functions near the existing `getDeepseekBaseUrl` / `getAiChatModel` block (~line 138):

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
  // Default: true if API key is set
  return Boolean(getVisionApiKey());
}
```

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS (no errors introduced)

**Step 3: Commit**

```bash
git add lib/env.ts
git commit -m "feat: add vision AI environment variable getters"
```

---

### Task 2: Create Vision AI client (`lib/ai/vision-client.ts`)

**Objective:** Create a dedicated OpenAI client for vision API calls — completely separate from the chat AI client.

**Files:**
- Create: `lib/ai/vision-client.ts`

**Step 1: Write the client**

```typescript
import "server-only";
import OpenAI from "openai";
import { getVisionEnabled, getVisionApiKey, getVisionBaseUrl, getVisionModel } from "@/lib/env";

let cachedVisionClient: OpenAI | null | undefined;

export function getVisionClient(): OpenAI | null {
  if (!getVisionEnabled()) return null;
  const apiKey = getVisionApiKey();
  if (!apiKey) return null;

  if (cachedVisionClient !== undefined) return cachedVisionClient;

  cachedVisionClient = new OpenAI({
    apiKey,
    baseURL: getVisionBaseUrl(),
  });

  return cachedVisionClient;
}

export function isVisionAvailable(): boolean {
  return Boolean(getVisionClient());
}

export function getVisionModelName(): string {
  return getVisionModel();
}
```

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add lib/ai/vision-client.ts
git commit -m "feat: add vision AI client for OCR receipt scanning"
```

---

### Task 3: Create OCR prompt and parser (`lib/ai/ocr-prompt.ts`)

**Objective:** Build the system prompt for the vision LLM and a parser that converts the LLM's response into structured transaction fields.

**Files:**
- Create: `lib/ai/ocr-prompt.ts`

**Step 1: Write the prompt and parser**

```typescript
import "server-only";

export const OCR_SYSTEM_PROMPT = `Anda adalah OCR scanner untuk struk/pemberitahuan transaksi Indonesia.

Tugas Anda: Ekstrak informasi transaksi dari gambar yang diberikan.

Aturan:
1. Jumlah (amount) HARUS dalam angka saja, tanpa "Rp", tanpa "IDR", tanpa titik/koma pemisah ribuan. Contoh: "Rp 38.200" → 38200.
2. Kategori (category) HARUS salah satu dari daftar ini:
   - Makanan (makan di resto/warung)
   - Belanja Harian (minimarket, alfamidi, indomaret, supermarket)
   - Kopi & Nongkrong (kafe, kopi)
   - Transportasi / Bensin (bensin, tol, parkir, transport)
   - Tagihan & Langganan (listrik, air, internet, pulsa)
   - Hiburan (bioskop, game, liburan)
   - Kesehatan (obat, dokter)
   - Transfer / Top Up (kirim uang, top up e-wallet)
   - Lainnya (tidak ada yang cocok)
3. Tanggal (date) HARUS format YYYY-MM-DD.
4. Jenis transaksi (kind): "expense" untuk pengeluaran, "income" untuk pemasukan.
5. Catatan (note): deskripsi singkat transaksi.

Response HARUS berupa JSON saja, tidak ada teks lain:
{
  "amount": 38200,
  "category": "Belanja Harian",
  "date": "2026-06-18",
  "note": "MIDI REGULER D - rokok & air mineral",
  "kind": "expense",
  "merchant": "MIDI REGULER D",
  "paymentMethod": "QRIS"
}`;

export interface OcrTransactionResult {
  amount: number;
  category: string;
  date: string;
  note: string;
  kind: "expense" | "income";
  merchant: string;
  paymentMethod: string;
}

/**
 * Parse the LLM's raw text response into structured OcrTransactionResult.
 * Handles markdown code fences and malformed JSON gracefully.
 */
export function parseOcrResponse(rawText: string): OcrTransactionResult | null {
  try {
    // Strip markdown code fences
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      amount: Math.abs(Number(parsed.amount ?? 0)),
      category: String(parsed.category ?? "Lainnya"),
      date: String(parsed.date ?? ""),
      note: String(parsed.note ?? ""),
      kind: String(parsed.kind ?? "expense") as "expense" | "income",
      merchant: String(parsed.merchant ?? ""),
      paymentMethod: String(parsed.paymentMethod ?? ""),
    };
  } catch {
    return null;
  }
}
```

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add lib/ai/ocr-prompt.ts
git commit -m "feat: add OCR system prompt and response parser"
```

---

### Task 4: Create OCR API endpoint (`app/api/ai/ocr-scan/route.ts`)

**Objective:** Create the POST endpoint that receives an image, calls the vision LLM, and returns structured transaction data.

**Files:**
- Create: `app/api/ai/ocr-scan/route.ts`

**Step 1: Write the route handler**

```typescript
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getVisionClient, getVisionModelName, isVisionAvailable } from "@/lib/ai/vision-client";
import { OCR_SYSTEM_PROMPT, parseOcrResponse, type OcrTransactionResult } from "@/lib/ai/ocr-prompt";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();

    if (!isVisionAvailable()) {
      return NextResponse.json(
        { ok: false, error: "OCR scanning is not available right now." },
        { status: 503 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let imageBase64: string;

    if (contentType.includes("multipart/form-data")) {
      // Browser FormData upload
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json(
          { ok: false, error: "No image file provided." },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { ok: false, error: "Image too large (max 5 MB)." },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      imageBase64 = buffer.toString("base64");
    } else if (contentType.includes("application/json")) {
      // JSON with base64 data URL
      const body = (await request.json()) as { image?: string };
      const raw = body.image ?? "";
      // Support both "data:image/...;base64,XXX" and raw base64
      const dataUrlMatch = raw.match(/^data:image\/[^;]+;base64,(.+)$/);
      imageBase64 = dataUrlMatch ? dataUrlMatch[1] : raw;
      if (!imageBase64) {
        return NextResponse.json(
          { ok: false, error: "No image data provided." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Unsupported content type. Use multipart/form-data or application/json." },
        { status: 400 }
      );
    }

    const client = getVisionClient()!;
    const model = getVisionModelName();
    const dataUrl = `data:image/jpeg;base64,${imageBase64}`;

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        { role: "system", content: OCR_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "auto" },
            },
          ],
        },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = parseOcrResponse(rawResponse);

    if (!parsed || !parsed.amount || parsed.amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Could not extract transaction details from image. Try a clearer photo.", raw: rawResponse },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      result: parsed satisfies OcrTransactionResult,
    });
  } catch (error: unknown) {
    console.error("[ocr-scan] Error:", (error as Error)?.message ?? error);
    return NextResponse.json(
      { ok: false, error: "OCR scan failed. Please try again." },
      { status: 500 }
    );
  }
}
```

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add app/api/ai/ocr-scan/route.ts
git commit -m "feat: add OCR scan API endpoint for receipt image processing"
```

---

### Task 5: Create `ScanReceiptButton` client component

**Objective:** Create the camera/file-picker button that captures an image, calls the OCR endpoint, and returns extracted transaction data to the parent form.

**Files:**
- Create: `components/features/transactions/scan-receipt-button.tsx`

**Step 1: Write the component**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OcrTransactionResult } from "@/lib/ai/ocr-prompt";

type ScanReceiptButtonProps = {
  onScanComplete: (result: OcrTransactionResult) => void;
  disabled?: boolean;
};

export function ScanReceiptButton({ onScanComplete, disabled }: ScanReceiptButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFileSelected(file: File | null) {
    if (!file || isProcessing) return;

    // Only accept images
    if (!file.type.startsWith("image/")) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ai/ocr-scan", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: OcrTransactionResult;
      };

      if (data.ok && data.result) {
        onScanComplete(data.result);
      } else {
        // TODO: Show toast notification
        console.warn("OCR scan failed:", data.error);
      }
    } catch {
      console.warn("OCR scan network error");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // rear camera on mobile
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      handleFileSelected(file);
    };
    input.click();
  }

  return (
    <Button
      type="button"
      variant="soft"
      disabled={disabled || isProcessing}
      onClick={handleClick}
      className="gap-2"
    >
      {isProcessing ? (
        <>
          <span className="animate-spin">⏳</span>
          Memproses...
        </>
      ) : (
        <>
          📷 Pindai Struk
        </>
      )}
    </Button>
  );
}
```

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add components/features/transactions/scan-receipt-button.tsx
git commit -m "feat: add scan receipt button component with camera capture"
```

---

### Task 6: Integrate scan button into `TransactionCreateForm`

**Objective:** Wire the scan button into the existing transaction create form so OCR results auto-fill the fields.

**Files:**
- Modify: `components/features/transactions/transaction-create-form.tsx`

**Step 1: Add state and scan handler**

Add imports at top:
```typescript
import { ScanReceiptButton } from "@/components/features/transactions/scan-receipt-button";
import type { OcrTransactionResult } from "@/lib/ai/ocr-prompt";
import { useState, useRef } from "react";
```

Remove the existing `useState` import from `react` if it exists (it likely does from `"use client"` context — adjust to combine with existing imports).

Add state and refs inside the component, before the return:
```typescript
const [scanResult, setScanResult] = useState<OcrTransactionResult | null>(null);
const [showScanConfirmation, setShowScanConfirmation] = useState(false);
const formRef = useRef<HTMLFormElement>(null);
```

**Step 2: Add scan handler function**

```typescript
function handleScanComplete(result: OcrTransactionResult) {
  setScanResult(result);
  setShowScanConfirmation(true);
}
```

**Step 3: Add auto-fill handler**

```typescript
function applyScanResult() {
  if (!scanResult || !formRef.current) return;

  const form = formRef.current;
  (form.querySelector<HTMLSelectElement>("select[name='kind']")!).value = scanResult.kind;
  (form.querySelector<HTMLInputElement>("input[name='amount']")!).value = String(scanResult.amount);
  (form.querySelector<HTMLInputElement>("input[name='note']")!).value = scanResult.note;
  (form.querySelector<HTMLInputElement>("input[name='happened_at']")!).value = scanResult.date;

  // Try to match category by name
  const categorySelect = form.querySelector<HTMLSelectElement>("select[name='category_id']")!;
  for (let i = 0; i < categorySelect.options.length; i++) {
    if (categorySelect.options[i].text.toLowerCase() === scanResult.category.toLowerCase()) {
      categorySelect.value = categorySelect.options[i].value;
      break;
    }
  }

  setScanResult(null);
  setShowScanConfirmation(false);
}
```

**Step 4: Add UI before the first label in the form**

```tsx
<div className="mb-4 flex items-center gap-3">
  <ScanReceiptButton onScanComplete={handleScanComplete} />

  {showScanConfirmation && scanResult && (
    <div className="flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-sm text-on-primary-container dark:bg-primary-container/20">
      <span>Rp {scanResult.amount.toLocaleString("id-ID")} — {scanResult.category}</span>
      <button
        type="button"
        onClick={applyScanResult}
        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary hover:opacity-90"
      >
        Pakai
      </button>
      <button
        type="button"
        onClick={() => { setScanResult(null); setShowScanConfirmation(false); }}
        className="ml-1 text-xs text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  )}
</div>
```

**Step 5: Add formRef to the form**

Change the `<ActionForm ...>` line to include a ref:

```tsx
<ActionForm
  ref={formRef}
  action={createTransaction}
  ...
```

> **⚠️ Note:** `ActionForm` wraps `form` and uses `forwardRef` — verify it passes `ref` through. If not, the plan's Task 7 handles that.

**Step 6: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 7: Commit**

```bash
git add components/features/transactions/transaction-create-form.tsx
git commit -m "feat: integrate OCR scan button into transaction create form"
```

---

### Task 7: Add `forwardRef` support to `ActionForm` (if missing)

**Objective:** Ensure `ActionForm` passes a ref to the underlying `<form>` element so we can auto-fill fields programmatically.

**Files:**
- Check: `components/ui/action-form.tsx`

**Step 1: Check if forwardRef is already supported**

Read the file at `components/ui/action-form.tsx`. If it already uses `forwardRef`, skip this task.

**Step 2: If not, add forwardRef**

```typescript
"use client";

import { type ComponentPropsWithoutRef, forwardRef, useRef } from "react";
// ... existing imports ...

export const ActionForm = forwardRef<HTMLFormElement, ActionFormProps>(
  function ActionForm({ action, onSuccess, resetOnSuccess, children, className, ...props }, ref) {
    // ... existing logic, but replace <form ...> with:
    return (
      <form ref={ref} action={formAction} className={className} {...props}>
        {children}
      </form>
    );
  }
);
```

**Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS (fix any type errors — adjust `ActionFormProps` if needed)

**Step 4: Commit**

```bash
git add components/ui/action-form.tsx
git commit -m "feat: add forwardRef support to ActionForm for OCR auto-fill"
```

---

### Task 8: Add env vars to `.env.example` and `README.md`

**Objective:** Document the new environment variables.

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

**Step 1: Add to `.env.example`**

```bash
# ── Vision / OCR (for receipt scanning) ────────────────────────────
# Using Sumopod proxy with Gemini 3.1 Flash Lite
# Leave blank to disable receipt scanning
VISION_ENABLED=true
VISION_API_KEY=sk-your-sumopod-key
VISION_BASE_URL=https://ai.sumopod.com/v1
VISION_MODEL=gemini/gemini-3.1-flash-lite
```

**Step 2: Add to README.md** — in the environment variables section, add:

```
| `VISION_ENABLED` | Enable/disable receipt OCR scanning (`true`/`false`) | `true` |
| `VISION_API_KEY` | API key for the vision AI provider (Sumopod) | — |
| `VISION_BASE_URL` | Vision AI provider base URL | `https://ai.sumopod.com/v1` |
| `VISION_MODEL` | Vision model to use | `gemini/gemini-3.1-flash-lite` |
```

**Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: add vision/OCR environment variable documentation"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Env vars | `lib/env.ts` |
| 2 | Vision client | `lib/ai/vision-client.ts` (NEW) |
| 3 | OCR prompt & parser | `lib/ai/ocr-prompt.ts` (NEW) |
| 4 | API endpoint | `app/api/ai/ocr-scan/route.ts` (NEW) |
| 5 | Scan button component | `components/features/transactions/scan-receipt-button.tsx` (NEW) |
| 6 | Form integration | `components/features/transactions/transaction-create-form.tsx` |
| 7 | ActionForm ref support | `components/ui/action-form.tsx` (conditional) |
| 8 | Documentation | `.env.example`, `README.md` |

**Total files:** 4 new, 2-3 modified, 1 docs update.

---

## Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Separate vision client from chat client | Chat uses DeepSeek; OCR uses Gemini. Different models, different base URLs, different keys. No coupling. |
| Direct API call from client (not server action) | Server actions don't support multipart/form-data natively in Next.js 15. Route handler handles file upload properly. |
| Return JSON, not SSE | OCR is a single request-response (not streaming). Simpler and faster. |
| Auto-fill existing form | Reuses all existing validation, error handling, and UX. No duplicate form logic. |
| `input.capture = "environment"` | Opens rear camera on mobile by default — user is scanning physical receipt. |
| Optional category match fallback | If the LLM returns a category name not in the user's wallet, the form's select stays untouched (user picks manually). |
| No separate OCR page | Keeps the feature where users already create transactions — the `TransactionCreateForm`. Discoverable, low friction. |

## Pitfalls to Watch

- **Base64 size limit:** 5MB file cap, but Next.js body parser has its own `bodySizeLimit`. Set `export const maxDuration = 30` in the route if needed.
- **Vision model speed:** Gemini Flash Lite is fast (~1-2s) but still slower than text. Show a spinner on the button during processing.
- **Dark mode:** The scan confirmation chip uses theme tokens (`primary-container`, `on-primary-container`) — verify in both light and dark themes.
- **iOS Safari camera:** `capture="environment"` works on iOS Safari, but on some Android browsers it shows both camera + gallery. Acceptable UX.
- **JSON parsing fragility:** The vision model sometimes wraps JSON in markdown code fences. The parser handles this, but test with real BCA/Mandiri/etc screenshots.

## Verification Checklist

- [ ] `VISION_ENABLED=false` → scan button hidden, endpoint returns 503
- [ ] `VISION_ENABLED=true` + valid key → button visible, scan works
- [ ] Upload BCA email screenshot → fields auto-filled with correct amount, date, merchant
- [ ] Upload QRIS receipt photo → fields auto-filled
- [ ] Click "Pakai" → form populated, user edits, saves → transaction in DB
- [ ] Click ✕ → confirmation dismissed, form unchanged
- [ ] No API key → button not rendered (graceful degradation)
- [ ] Both light and dark themes render correctly
