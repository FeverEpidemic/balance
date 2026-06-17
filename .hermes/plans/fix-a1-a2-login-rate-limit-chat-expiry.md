---
title: Fix A1 & A2 — Login Brute Force + Chat History Expiry
created: 2026-06-17
status: pending
---

## A1 — Login Brute Force Rate Limit (by IP)

### Problem
`app/actions/auth.ts` → `login()` langsung panggil `signInWithPassword` tanpa rate limit.
Attacker bisa brute force password via server action tanpa hambatan.

### Approach
Rate limit by IP address, 5 attempts per 15 menit per IP.
Pattern ikuti existing `consumeRateLimit` di `lib/rate-limit.ts`.

### Files to touch
1. `lib/rate-limit.ts` — tambah `consumeLoginRateLimit(ip)` helper
2. `app/actions/auth.ts` — inject rate limit check sebelum `signInWithPassword`
3. `messages/id.json` & `messages/en.json` — pesan error rate limit

### Step-by-step

#### Step 1: Tambah helper rate limit login (`lib/rate-limit.ts`)

```ts
// Di akhir file, setelah existing helpers
export async function consumeLoginRateLimit(ip: string, now?: number) {
  const limit = 5;
  const windowSeconds = 15 * 60; // 15 menit
  return consumeRateLimit({
    namespace: "rate-limit:auth-login",
    key: ip,
    limit,
    windowSeconds,
    now
  });
}
```

Note: Login rate limit **tidak pakai env var** — hardcoded 5/15min. Ini security control, bukan feature toggle. Kalau Redis mati, fallback ke `allowed: true` (existing pattern) — artinya rate limit off tapi login tetap jalan. Ini acceptable karena Supabase juga ada built-in rate limit.

#### Step 2: Inject ke login action (`app/actions/auth.ts`)

Sebelum `signInWithPassword`:
```ts
// Rate limit login attempts by IP
const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
const rateLimit = await consumeLoginRateLimit(ip);
if (!rateLimit.allowed) {
  redirect(withAuthMessage("/login", "error", translate(locale, "actionErrors.loginRateLimited"), next, "/dashboard", locale));
}
```

Import yang dibutuhkan:
- `import { consumeLoginRateLimit } from "@/lib/rate-limit";`
- `import { headers } from "next/headers";`

#### Step 3: Terjemahan (`messages/id.json`, `messages/en.json`)

```json
// id.json
"loginRateLimited": "Terlalu banyak percobaan login. Coba lagi nanti."

// en.json  
"loginRateLimited": "Too many login attempts. Please try again later."
```

### Verification
- `npm run typecheck && npm run test`
- Test: 6x login gagal dalam 15 menit → rate limited
- Test: login sukses tetap jalan normal
- Test: Redis mati → login tetap jalan (fallback `allowed: true`)

---

## A2 — Chat History Auto-Expire (30 hari)

### Problem
Chat history AI (termasuk nominal transaksi, nama wallet) disimpan di `localStorage` tanpa expiry.
Kalau device shared, history finansial terekspos selamanya.

### Approach
Tambah timestamp `savedAt` ke `StoredChatSession`. Saat load dari localStorage,
cek apakah lebih dari 30 hari — kalau ya, hapus.

### Files to touch
1. `lib/chat-session.ts` — tambah `CHAT_MAX_AGE_DAYS`, update `sanitizeStoredChatSession`
2. `components/features/chat/chat-page-content.tsx` — tambah `savedAt` saat save

### Step-by-step

#### Step 1: Tambah konstanta dan update type (`lib/chat-session.ts`)

```ts
// Di dekat CHAT_STORAGE_KEY
export const CHAT_MAX_AGE_DAYS = 30;
```

Update `StoredChatSession`:
```ts
export type StoredChatSession = {
  messages: UiChatMessage[];
  selectedPeriod: RekapPeriod;
  selectedWalletId: string;
  activeSuggestion?: string;
  runningSummary?: string;
  savedAt: number; // timestamp in ms — NEW
};
```

Update `sanitizeStoredChatSession` — tambah di akhir:
```ts
const savedAt = typeof candidate.savedAt === "number" && candidate.savedAt > 0 
  ? candidate.savedAt 
  : Date.now();

// Check expiry
const maxAge = CHAT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
if (Date.now() - savedAt > maxAge) {
  return null; // expired — akan trigger fresh session
}

return {
  messages,
  selectedPeriod,
  selectedWalletId,
  activeSuggestion,
  runningSummary: typeof candidate.runningSummary === "string" ? candidate.runningSummary : undefined,
  savedAt
};
```

#### Step 2: Update save logic (`components/features/chat/chat-page-content.tsx`)

Ubah object yang di-save dari:
```ts
JSON.stringify({
  messages,
  selectedPeriod,
  selectedWalletId,
  activeSuggestion,
  runningSummary
})
```
Jadi:
```ts
JSON.stringify({
  messages,
  selectedPeriod,
  selectedWalletId,
  activeSuggestion,
  runningSummary,
  savedAt: Date.now()
})
```

### Verification
- `npm run typecheck && npm run test`
- Test: chat history < 30 hari → dimuat normal
- Test: chat history > 30 hari (bisa di-simulasi dengan ubah `savedAt`) → dihapus, mulai fresh
- Test: chat history tanpa `savedAt` (existing user) → dianggap baru (savedAt = Date.now())

---

## Impact & Risk Assessment

| Aspek | A1 (Login RL) | A2 (Chat expiry) |
|-------|--------------|-----------------|
| Breaking change | Tidak — existing flow tetap | Tidak — existing session dianggap baru |
| Redis dependency | Best-effort (fallback allow) | Tidak perlu Redis |
| Migration needed | Tidak | Tidak |
| UI change | Hanya error message baru | Tidak ada UI change |
| Test update | Tidak ada test login saat ini | Update `sanitizeStoredChatSession` test |
