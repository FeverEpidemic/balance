---
title: Balance — Testing Guide
version: 1.1.0
last_updated: 2026-06-17
framework: Vitest 0.34
---

# Balance — Testing Guide

> Panduan menulis dan menjalankan test untuk Balance. Dibaca oleh AI agent dan developer.

---

## 1. Setup Testing

**Framework:** Vitest (~0.34.6)
**Config:** `vitest.config.ts`
**Mock server-only:** `tests/support/server-only.ts` — alias untuk `server-only` package

```bash
npm run test          # vitest run (all tests)
npm run test:unit     # vitest run (sama)
npm run typecheck     # tsc --noEmit (type checking)
```

---

## 2. Daftar Test & Coverage

| File | Yang Di-test |
|------|-------------|
| `finance.test.ts` | `parseNumberInput`, `formatCurrency`, `getCurrentMonthKey`, `getMonthRange`, date math |
| `data-mappers.test.ts` | `buildWalletSummaries`, `createDashboardData`, transform functions |
| `recurring.test.ts` | `nextOccurrence`, recurrence calculation, date boundary logic |
| `redis-cache.test.ts` | `getOrSet`, `invalidate`, cache key generation |
| `auth-flow.test.ts` | Auth sync logic, profile creation/update |
| `chat-api-rate-limit.test.ts` | Rate limiter integration with chat auth |
| `chat-auth.test.ts` | API key verification, hash matching, revocation check |
| `wallet-capacity.test.ts` | Member capacity limit enforcement |
| `balance-adjustments.test.ts` | Balance adjustment calculations |
| `theme.test.ts` | Theme resolution (light/dark/system) |
| `theme-actions.test.ts` | Theme preference update logic |
| `rate-limit.test.ts` | Sliding window algorithm, Redis key TTL |
| `onboarding-actions.test.ts` | Onboarding state transitions |
| `action-results.test.ts` | Action result types and helpers |
| `utils.test.ts` | Generic utility functions |
| `i18n.test.ts` | Translation key lookup, fallback behavior |

---

## 3. Pola Penulisan Test

### 3.1. Test untuk Pure Function (recommended)

Contoh dari `tests/unit/finance.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatCurrency, parseNumberInput } from "@/lib/finance";

describe("formatCurrency", () => {
  it("formats IDR with thousand separators and symbol", () => {
    expect(formatCurrency(15000)).toBe("Rp15.000");
    expect(formatCurrency(1500000)).toBe("Rp1.500.000");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("Rp0");
  });
});
```

### 3.2. Test untuk Fungsi dengan Date

```typescript
import { describe, it, expect, vi } from "vitest";
import { getCurrentMonthKey } from "@/lib/finance";

describe("getCurrentMonthKey", () => {
  it("returns YYYY-MM based on current date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15"));
    expect(getCurrentMonthKey()).toBe("2026-06");
    vi.useRealTimers();
  });
});
```

### 3.3. Test untuk Error Handling

```typescript
import { describe, it, expect } from "vitest";
import { parseNumberInput } from "@/lib/finance";

describe("parseNumberInput", () => {
  it("returns null for empty input", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput(null)).toBeNull();
    expect(parseNumberInput(undefined)).toBeNull();
  });

  it("returns number for valid input", () => {
    expect(parseNumberInput("15000")).toBe(15000);
    expect(parseNumberInput("15.000")).toBe(15000);
  });
});
```

### 3.4. Test untuk Data Mappers

```typescript
import { describe, it, expect } from "vitest";
import { buildWalletSummaries } from "@/lib/data/mappers";

describe("buildWalletSummaries", () => {
  it("calculates correct income, expense, and net", () => {
    const input = {
      memberships: [{ wallet_id: "wallet-1", role: "owner" }],
      wallets: [{ id: "wallet-1", name: "Test", kind: "personal" }],
      memberRows: [],
      transactions: [
        { id: "t1", wallet_id: "wallet-1", kind: "income", amount: 100000 },
        { id: "t2", wallet_id: "wallet-1", kind: "expense", amount: 25000 },
      ],
      savings: [],
      savingEntries: [],
      budgets: [],
      month: "2026-06",
    };

    const result = buildWalletSummaries(input);
    expect(result[0].totalIncome).toBe(100000);
    expect(result[0].totalExpense).toBe(25000);
    expect(result[0].net).toBe(75000);
  });
});
```

### 3.5. Test untuk Redis Cache

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { redisCache } from "@/lib/redis";

describe("redisCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls factory function when cache miss", async () => {
    const factory = vi.fn().mockResolvedValue("fresh-data");
    const result = await redisCache.getOrSet("test-key", 60, factory);
    expect(factory).toHaveBeenCalledOnce();
    expect(result).toBe("fresh-data");
  });

  it("falls back to factory when redis unavailable", async () => {
    const factory = vi.fn().mockResolvedValue("fallback-data");
    // Simulate REDIS_ENABLED=false
    const result = await redisCache.getOrSet("test-key", 60, factory);
    expect(factory).toHaveBeenCalledOnce();
    expect(result).toBe("fallback-data");
  });
});
```

---

## 4. Yang WAJIB di-test

Setiap perubahan yang menyentuh:

- **Pure helpers** — `lib/finance.ts`, `lib/utils.ts`, `lib/i18n.ts`
- **Data mappers** — Transform DB → UI model di `lib/data/mappers.ts`
- **Recurring logic** — Date math, boundary condition
- **Cache behavior** — Redis fallback, invalidation
- **Permission branching** — Role-based conditional logic
- **Error handling** — Edge case input, null/undefined handling

---

## 5. Yang TIDAK Perlu di-test (saat ini)

- **Komponen React** — Belum ada setup React Testing Library / jsdom
- **Integrasi database** — Butuh Supabase live instance
- **E2E flow** — Butuh Playwright/Cypress
- **Server Actions** — Butuh mock supabase yang kompleks

Jika perubahan perlu verifikasi yang tidak bisa di-unit-test, tulis explicit di handoff message.

---

## 6. Mock Server-Only

`tests/support/server-only.ts`:
```typescript
// Alias untuk 'server-only' package di vitest
// Biar test bisa jalan tanpa runtime check
const serverOnly = {};
export default serverOnly;
```

---

## 7. Checklist Sebelum Push / PR

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run test` — all tests pass
- [ ] Test baru untuk logic yang berubah
- [ ] Edge cases di-test (null, empty, boundary)
- [ ] Redis fallback path tetap jalan
- [ ] `CHANGELOG.md` diupdate
