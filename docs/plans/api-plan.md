# Chat API & API Key Management — Implementation Plan

> **For Codex CLI:** Execute tasks sequentially in order. Each task is 2-5 minutes of work. Commit after each task.

**Goal:** Add user-scoped API keys so Balance can be controlled via chat (Telegram/Hermes) without sharing Supabase credentials.

**Architecture:**
- User generates API key from Settings page → key hashed & stored in DB → raw key shown once
- External callers (Hermes, curl scripts) send key via `Authorization: Bearer ***
- API routes verify key → resolve user_id → query/insert data scoped to that user
- No SUPABASE_SECRET_KEY leaves the server, no CHAT_API_KEY env var needed

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL), TypeScript

**Repo root:** `/home/ilham827/balance`

---

### Task 1: Add `user_api_keys` Supabase migration

**Objective:** Create database table to store hashed API keys

**Files:**
- Create: `supabase/migrations/0011_user_api_keys.sql`

**Step 1: Write migration**

```sql
-- Migration: user_api_keys
-- Stores hashed API keys for external chat/API access

create table if not exists user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'default',
  key_hash text not null unique,           -- SHA-256 of the full key
  key_prefix text not null,                -- First 12 chars for display (e.g. "bal_a1b2c3d4...")
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

-- Index for fast lookup by key_hash
create index idx_user_api_keys_key_hash on user_api_keys(key_hash);

-- RLS: users can only see/manage their own keys
alter table user_api_keys enable row level security;

create policy "Users view own keys"
  on user_api_keys for select
  using (auth.uid() = user_id);

create policy "Users insert own keys"
  on user_api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users update own keys"
  on user_api_keys for update
  using (auth.uid() = user_id);

create policy "Users delete own keys"
  on user_api_keys for delete
  using (auth.uid() = user_id);
```

**Step 2: Run migration**

```bash
npx supabase migration up
```

**Step 3: Commit**

```bash
git add supabase/migrations/0011_user_api_keys.sql
git commit -m "feat: add user_api_keys table for scoped API access"
```

---

### Task 2: Add type & cache key for API keys

**Objective:** Add TypeScript type and cache key helpers for user_api_keys

**Files:**
- Modify: `lib/data/types.ts` (append at end)
- Modify: `lib/data/cache.ts` (append at end)

**Step 1: Add type to `lib/data/types.ts`**

Append before the last closing line:

```typescript
export type UserApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};
```

**Step 2: Add cache key to `lib/data/cache.ts`**

Append before the last closing line:

```typescript
export function getUserApiKeysCacheKey(userId: string) {
  return `user:${userId}:api-keys`;
}
```

**Step 3: Commit**

```bash
git add lib/data/types.ts lib/data/cache.ts
git commit -m "feat: add UserApiKeyRow type and cache key"
```

---

### Task 3: Create chat-auth utility

**Objective:** Utility to generate, hash, and verify API keys

**Files:**
- Create: `lib/chat-auth.ts`

**Step 1: Write the file**

```typescript
import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const KEY_PREFIX = "bal_";
const KEY_BYTES = 32; // 256-bit key

export interface VerifiedKey {
  userId: string;
  keyId: string;
  name: string;
}

/**
 * Generate a new API key.
 * Returns { rawKey, keyHash, keyPrefix }.
 * - rawKey: show to user once (e.g. "bal_a1b2c3...")
 * - keyHash: SHA-256 hash — store in DB
 * - keyPrefix: first 12 chars for UI display
 */
export function generateApiKey(name: string): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomBytes = crypto.randomBytes(KEY_BYTES);
  const rawKey = KEY_PREFIX + randomBytes.toString("hex");
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12) + "...";
  return { rawKey, keyHash, keyPrefix };
}

/**
 * Verify an API key from Authorization header.
 * Returns user info if valid, null if invalid/revoked.
 */
export async function verifyApiKey(
  authHeader: string | null
): Promise<VerifiedKey | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const rawKey = authHeader.slice("Bearer ".length).trim();
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) {
    return null;
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("user_api_keys")
    .select("id, user_id, name, revoked_at")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) return null;
  if (data.revoked_at) return null;

  // Update last_used_at in background (fire-and-forget)
  admin
    .from("user_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then();

  return {
    userId: data.user_id,
    keyId: data.id,
    name: data.name,
  };
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit --strict lib/chat-auth.ts
```

**Step 3: Commit**

```bash
git add lib/chat-auth.ts
git commit -m "feat: add chat-auth utility for API key generation and verification"
```

---

### Task 4: Add API key data queries to lib/data/

**Objective:** Query functions for API keys (used by the settings page)

**Files:**
- Modify: `lib/data/queries.ts` (append before end of file)

**Step 1: Add query functions**

Append before the last export in `lib/data/queries.ts`:

```typescript
import type { UserApiKeyRow } from "@/lib/data/types";

// ... existing queries ...

export async function queryUserApiKeys(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("id, user_id, name, key_prefix, created_at, last_used_at, revoked_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserApiKeyRow[];
}
```

**Step 2: Commit**

```bash
git add lib/data/queries.ts
git commit -m "feat: add queryUserApiKeys data function"
```

---

### Task 5: Create server actions for API key management

**Objective:** Server actions to generate and revoke API keys

**Files:**
- Create: `app/actions/api-keys.ts`

**Step 1: Write the actions file**

```typescript
"use server";

import { requireUser } from "@/lib/auth";
import { generateApiKey } from "@/lib/chat-auth";
import { invalidateApiKeysCache } from "@/lib/data/cache";
import { createClient } from "@/lib/supabase/server";
import {
  errorResult,
  getStringValue,
  successResult,
  type ActionResult,
} from "@/app/actions/_shared";

export async function createApiKey(
  _prevState: ActionResult,
  formData: FormData
): Promise<
  ActionResult & { rawKey?: string; keyPrefix?: string }
> {
  const { user } = await requireUser();
  const name = getStringValue(formData, "name").trim() || "default";

  const { rawKey, keyHash, keyPrefix } = generateApiKey(name);

  const supabase = await createClient();
  const { error } = await supabase.from("user_api_keys").insert({
    user_id: user.id,
    name,
    key_hash: keyHash,
    key_prefix: keyPrefix,
  });

  if (error) {
    return { ...errorResult("Gagal membuat API key"), rawKey: undefined };
  }

  await invalidateApiKeysCache(user.id);

  return {
    status: "success",
    message: "API key berhasil dibuat. Simpan key ini — tidak akan ditampilkan lagi.",
    rawKey,
    keyPrefix,
    resetForm: true,
  };
}

export async function revokeApiKey(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { user } = await requireUser();
  const keyId = getStringValue(formData, "key_id");

  if (!keyId) {
    return errorResult("ID key tidak valid");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) {
    return errorResult("Gagal mencabut API key");
  }

  await invalidateApiKeysCache(user.id);

  return successResult("API key berhasil dicabut");
}

export async function deleteApiKey(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { user } = await requireUser();
  const keyId = getStringValue(formData, "key_id");

  if (!keyId) {
    return errorResult("ID key tidak valid");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) {
    return errorResult("Gagal menghapus API key");
  }

  await invalidateApiKeysCache(user.id);

  return successResult("API key berhasil dihapus");
}
```

**Step 2: Add cache invalidation helper to `lib/data/cache.ts`**

Append in `lib/data/cache.ts` after `getUserApiKeysCacheKey`:

```typescript
export async function invalidateApiKeysCache(userId: string) {
  await redisCache.del([getUserApiKeysCacheKey(userId)]);
}
```

**Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add app/actions/api-keys.ts lib/data/cache.ts
git commit -m "feat: add API key management server actions (create, revoke, delete)"
```

---

### Task 6: Create Settings page in Balance UI

**Objective:** Settings page where user can create, view, and revoke API keys

**Files:**
- Create: `app/(app)/settings/page.tsx`
- Create: `components/features/settings/settings-content.tsx`
- Modify: `components/app-shell.tsx` (add "Settings" to nav)
- Modify: `lib/data/index.ts` (add getSettingsData)

**Step 1: Create settings data function in `lib/data/index.ts`**

Append before closing:

```typescript
import { queryUserApiKeys } from "@/lib/data/queries";

export const getSettingsData = cache(async (userId: string) => {
  const [shell, apiKeys] = await Promise.all([
    getShellData(userId),
    queryUserApiKeys(userId),
  ]);

  return { shell, apiKeys };
});
```

**Step 2: Create `components/features/settings/settings-content.tsx`**

```tsx
import { AppShell } from "@/components/app-shell";
import { createApiKey, revokeApiKey, deleteApiKey } from "@/app/actions/api-keys";
import type { UserApiKeyRow } from "@/lib/data/types";

function ApiKeyCard({
  key: apiKey,
}: {
  key: UserApiKeyRow;
}) {
  const isActive = !apiKey.revoked_at;

  return (
    <div className="rounded-xl border border-white/60 bg-[rgba(255,255,255,0.68)] p-4 shadow-serene">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{apiKey.name}</p>
          <code className="mt-1 block text-xs text-muted-foreground">
            {apiKey.key_prefix}
          </code>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Dibuat: {new Date(apiKey.created_at).toLocaleDateString("id-ID")}
            {apiKey.last_used_at
              ? ` · Terakhir dipakai: ${new Date(apiKey.last_used_at).toLocaleDateString("id-ID")}`
              : " · Belum pernah dipakai"}
          </p>
        </div>
        {isActive ? (
          <form action={revokeApiKey}>
            <input type="hidden" name="key_id" value={apiKey.id} />
            <button
              type="submit"
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-600 transition hover:bg-rose-100"
            >
              Cabut
            </button>
          </form>
        ) : (
          <form action={deleteApiKey}>
            <input type="hidden" name="key_id" value={apiKey.id} />
            <button
              type="submit"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100"
            >
              Hapus
            </button>
          </form>
        )}
      </div>
      {!isActive && (
        <p className="mt-2 text-[11px] text-rose-500">Dicabut — tidak bisa dipakai lagi</p>
      )}
    </div>
  );
}

export function SettingsContent({
  shell,
  apiKeys,
}: {
  shell: { userName: string; walletCount: number; budgetCount: number; memberCount: number; primaryWalletId: string | null };
  apiKeys: UserApiKeyRow[];
}) {
  const activeKeys = apiKeys.filter((k) => !k.revoked_at);
  const revokedKeys = apiKeys.filter((k) => k.revoked_at);

  return (
    <AppShell
      currentPath="/settings"
      title="Pengaturan"
      subtitle="Atur akses API untuk integrasi eksternal"
      userName={shell.userName}
      walletCount={shell.walletCount}
      budgetCount={shell.budgetCount}
      memberCount={shell.memberCount}
      primaryWalletId={shell.primaryWalletId}
    >
      {/* Create new key */}
      <section className="rounded-xl border border-white/60 bg-[rgba(255,255,255,0.68)] p-4 shadow-serene">
        <h3 className="font-medium text-foreground">Buat API Key Baru</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          API key untuk mengakses Balance dari chat atau script eksternal. Key hanya ditampilkan sekali.
        </p>
        <form action={createApiKey} className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="key-name" className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Nama Key
            </label>
            <input
              id="key-name"
              name="name"
              type="text"
              placeholder="Contoh: Hermes Chat, Script Automation"
              className="w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            Buat Key
          </button>
        </form>
      </section>

      {/* Active keys */}
      {activeKeys.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            API Key Aktif ({activeKeys.length})
          </h3>
          <div className="space-y-3">
            {activeKeys.map((k) => (
              <ApiKeyCard key={k.id} key={k} />
            ))}
          </div>
        </section>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            API Key Dicabut ({revokedKeys.length})
          </h3>
          <div className="space-y-3 opacity-60">
            {revokedKeys.map((k) => (
              <ApiKeyCard key={k.id} key={k} />
            ))}
          </div>
        </section>
      )}

      {/* Info */}
      <section className="mt-6 rounded-xl border border-white/60 bg-[rgba(255,255,255,0.68)] p-4 shadow-serene">
        <h3 className="text-sm font-medium text-foreground">Cara Pakai</h3>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          <p>Kirim key ini via header <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization: Bearer &lt;key&gt;</code></p>
          <div className="mt-3 space-y-1">
            <p className="font-medium text-foreground">Endpoint:</p>
            <code className="block rounded bg-muted px-3 py-2 text-xs">
              POST /api/chat/transaction{'\n'}
              {`{ "wallet_id": "...", "category_id": "...", "amount": 50000, "note": "Makan siang", "kind": "expense", "happened_at": "2026-06-06" }`}
            </code>
            <code className="block rounded bg-muted px-3 py-2 text-xs mt-2">
              GET /api/chat/rekap?period=week&amp;wallet_id=...
            </code>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
```

**Step 3: Create `app/(app)/settings/page.tsx`**

```tsx
import { requireUser } from "@/lib/auth";
import { getSettingsData } from "@/lib/data";
import { SettingsContent } from "@/components/features/settings/settings-content";

export default async function SettingsPage() {
  const { user } = await requireUser();
  const data = await getSettingsData(user.id);

  return <SettingsContent shell={data.shell} apiKeys={data.apiKeys} />;
}
```

**Step 4: Add "Settings" to navigation in `components/app-shell.tsx`**

In the `navItems` array (desktop sidebar), add after templates:

```typescript
{ href: "/settings", label: "Pengaturan" },
```

In the `mobileNavItems` array (mobile bottom nav), add after Laporan:

```typescript
{ href: "/settings", label: "Pengaturan" },
```

In `mobileWalletShortcuts`, do NOT add settings (it's wallet-specific).

**Step 5: Verify compilation**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add app/(app)/settings/ components/features/settings/ lib/data/index.ts components/app-shell.tsx
git commit -m "feat: add Settings page with API key management UI"
```

---

### Task 7: Create POST /api/chat/transaction endpoint

**Objective:** API route to create a transaction using API key auth

**Files:**
- Create: `app/api/chat/transaction/route.ts`

**Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/chat-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = await verifyApiKey(
    request.headers.get("authorization")
  );

  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing API key" },
      { status: 401 }
    );
  }

  let body: {
    wallet_id?: string;
    category_id?: string | null;
    amount?: number;
    note?: string | null;
    kind?: "income" | "expense";
    happened_at?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.wallet_id || !body.amount || !body.kind) {
    return NextResponse.json(
      { error: "Missing required fields: wallet_id, amount, kind" },
      { status: 400 }
    );
  }

  if (body.amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be positive" },
      { status: 400 }
    );
  }

  if (!["income", "expense"].includes(body.kind)) {
    return NextResponse.json(
      { error: "kind must be 'income' or 'expense'" },
      { status: 400 }
    );
  }

  // Verify user is a member of this wallet
  const admin = createAdminClient()!;
  const { data: membership, error: membershipError } = await admin
    .from("wallet_members")
    .select("wallet_id, role")
    .eq("wallet_id", body.wallet_id)
    .eq("user_id", auth.userId)
    .single();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "You are not a member of this wallet" },
      { status: 403 }
    );
  }

  // Check if viewer role (can't write)
  if (membership.role === "viewer") {
    return NextResponse.json(
      { error: "Viewers cannot create transactions" },
      { status: 403 }
    );
  }

  const happenedAt = body.happened_at || new Date().toISOString();

  const { data: transaction, error: insertError } = await admin
    .from("transactions")
    .insert({
      wallet_id: body.wallet_id,
      category_id: body.category_id || null,
      kind: body.kind,
      amount: body.amount,
      note: body.note || null,
      happened_at: happenedAt,
      source: "manual",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create transaction: " + insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    transaction: {
      id: transaction.id,
      wallet_id: transaction.wallet_id,
      kind: transaction.kind,
      amount: transaction.amount,
      note: transaction.note,
      happened_at: transaction.happened_at,
      category_id: transaction.category_id,
    },
  });
}
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/api/chat/transaction/route.ts
git commit -m "feat: add POST /api/chat/transaction endpoint with API key auth"
```

---

### Task 8: Create GET /api/chat/rekap endpoint

**Objective:** API route to get spending recap using API key auth

**Files:**
- Create: `app/api/chat/rekap/route.ts`

**Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/chat-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function getPeriodRange(period: string): { start: string; end: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (period) {
    case "day": {
      const start = new Date(year, month, now.getDate());
      const end = new Date(year, month, now.getDate() + 1);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
        label: "Hari ini",
      };
    }
    case "week": {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
      const monday = new Date(year, month, now.getDate() - diff);
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      return {
        start: monday.toISOString(),
        end: nextMonday.toISOString(),
        label: "Minggu ini",
      };
    }
    case "month":
    default: {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
        label: `Bulan ${now.toLocaleString("id-ID", { month: "long" })}`,
      };
    }
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(
    request.headers.get("authorization")
  );

  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing API key" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "month";
  const walletId = url.searchParams.get("wallet_id");
  const admin = createAdminClient()!;

  // Get user's wallet IDs
  let walletIds: string[];
  if (walletId) {
    // Verify membership for specific wallet
    const { data: membership } = await admin
      .from("wallet_members")
      .select("wallet_id")
      .eq("wallet_id", walletId)
      .eq("user_id", auth.userId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Wallet not found or access denied" },
        { status: 403 }
      );
    }
    walletIds = [walletId];
  } else {
    const { data: memberships } = await admin
      .from("wallet_members")
      .select("wallet_id")
      .eq("user_id", auth.userId);

    walletIds = (memberships ?? []).map((m: { wallet_id: string }) => m.wallet_id);
  }

  if (walletIds.length === 0) {
    return NextResponse.json({
      period,
      total_income: 0,
      total_expense: 0,
      net: 0,
      by_category: [],
      by_wallet: [],
      message: "Tidak ada wallet ditemukan",
    });
  }

  const range = getPeriodRange(period);

  // Get transactions in period
  const { data: transactions } = await admin
    .from("transactions")
    .select("id, wallet_id, category_id, kind, amount, note, happened_at")
    .in("wallet_id", walletIds)
    .gte("happened_at", range.start)
    .lte("happened_at", range.end)
    .order("happened_at", { ascending: false });

  const txns = transactions ?? [];

  // Get categories for this wallet
  const { data: categories } = await admin
    .from("categories")
    .select("id, name, color, kind")
    .in("wallet_id", walletIds);

  const categoryMap = new Map(
    (categories ?? []).map((c: { id: string; name: string; color: string }) => [c.id, c])
  );

  // Get wallets for name lookup
  const { data: wallets } = await admin
    .from("wallets")
    .select("id, name")
    .in("id", walletIds);

  const walletMap = new Map(
    (wallets ?? []).map((w: { id: string; name: string }) => [w.id, w])
  );

  // Aggregate
  const totalIncome = txns
    .filter((t: { kind: string }) => t.kind === "income")
    .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

  const totalExpense = txns
    .filter((t: { kind: string }) => t.kind === "expense")
    .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

  // By category
  const categorySpend = new Map<string, { name: string; color: string; total: number; count: number }>();
  for (const t of txns) {
    if (t.kind !== "expense") continue;
    const cat = t.category_id ? categoryMap.get(t.category_id) : null;
    const catName = cat?.name || "Tanpa kategori";
    const catColor = cat?.color || "#94a3b8";
    const existing = categorySpend.get(t.category_id || "__none") || {
      name: catName,
      color: catColor,
      total: 0,
      count: 0,
    };
    existing.total += t.amount;
    existing.count += 1;
    categorySpend.set(t.category_id || "__none", existing);
  }

  // By wallet
  const walletSpend = new Map<string, { name: string; income: number; expense: number }>();
  for (const t of txns) {
    const w = walletMap.get(t.wallet_id);
    const wName = w?.name || "Unknown";
    const existing = walletSpend.get(t.wallet_id) || {
      name: wName,
      income: 0,
      expense: 0,
    };
    if (t.kind === "income") existing.income += t.amount;
    else existing.expense += t.amount;
    walletSpend.set(t.wallet_id, existing);
  }

  return NextResponse.json({
    period,
    label: range.label,
    start_date: range.start,
    end_date: range.end,
    total_income: totalIncome,
    total_expense: totalExpense,
    net: totalIncome - totalExpense,
    transaction_count: txns.length,
    by_category: Array.from(categorySpend.values()).sort(
      (a, b) => b.total - a.total
    ),
    by_wallet: Array.from(walletSpend.values()),
  });
}
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/api/chat/rekap/route.ts
git commit -m "feat: add GET /api/chat/rekap endpoint with period filtering"
```

---

### Task 9: Full integration test

**Objective:** Verify everything works end-to-end

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Generate an API key from the Settings page**

- Open `http://localhost:3000/settings` in browser
- Login with your account
- Click "Buat Key" with name "Test Key"
- Copy the displayed key

**Step 3: Test transaction creation**

```bash
curl -X POST http://localhost:3000/api/chat/transaction \
  -H "Authorization: Bearer <copied_key>" \
  -H "Content-Type: application/json" \
  -d '{"wallet_id":"<your_wallet_id>","amount":50000,"kind":"expense","note":"Makan siang test"}'
```

Expected: `{"success":true,"transaction":{...}}`

**Step 4: Test recap**

```bash
curl "http://localhost:3000/api/chat/rekap?period=week&wallet_id=<your_wallet_id>" \
  -H "Authorization: Bearer <copied_key>"
```

Expected: `{"period":"week","total_income":0,"total_expense":50000,"net":-50000,...}`

**Step 5: Test unauthorized**

```bash
curl -X POST http://localhost:3000/api/chat/transaction \
  -H "Content-Type: application/json" \
  -d '{"wallet_id":"x","amount":1000,"kind":"expense"}'
```

Expected: `{"error":"Unauthorized ...","status":401}`

---

## After Deployment

Once pushed to the VPS, I (Hermes) will start calling the live endpoints at `https://finance.acknowledge.my.id/api/chat/*` using the API key you generate from the Settings page.
