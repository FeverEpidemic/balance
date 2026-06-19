# Performance & UX Fix Plan — Balance

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix 4 remaining performance/UX gaps: error boundaries coverage, branded 404, `next/image` optimization, and optimistic UI for delete transactions.

**Architecture:** Incremental patches to existing components — no new infra needed. Each fix is self-contained in 1-3 files. Follow existing patterns (AppShell for error pages, ActionForm for forms, `page-loading-skeleton.tsx` for loading states).

**Tech Stack:** Next.js 15.3 App Router, TypeScript, React 19, Tailwind CSS v4

---

### Task 1: Root `not-found.tsx` — Branded 404 Page

**Objective:** Create a branded 404 page so invalid routes/wallet IDs show a proper Balance UI instead of default Next.js 404

**Files:**
- Create: `app/[locale]/not-found.tsx`

**Step 1: Create the not-found page**

Create `app/[locale]/not-found.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { getTranslator, resolveLocale } from "@/lib/i18n";

export default async function NotFoundPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);

  return (
    <main className="page-wrap flex min-h-screen items-center py-10">
      <section className="glass-panel-strong mx-auto w-full max-w-md rounded-[2rem] p-6 shadow-float md:p-10">
        <p className="eyebrow">{t("notFound.eyebrow", "", { fallback: "404" })}</p>
        <h1 className="headline-lg mt-4">
          {t("notFound.title", "", { fallback: "Halaman tidak ditemukan" })}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {t("notFound.description", "", { fallback: "Halaman yang kamu cari tidak ada atau sudah dipindah." })}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/">{t("notFound.goHome", "", { fallback: "Ke Beranda" })}</Button>
          <Button href="/login" variant="ghost">
            {t("notFound.goLogin", "", { fallback: "Masuk" })}
          </Button>
        </div>
      </section>
    </main>
  );
}
```

**Step 2: Add i18n keys**

Add to `messages/id.json` and `messages/en.json`:

For `id.json`:
```json
"notFound": {
  "eyebrow": "404",
  "title": "Halaman tidak ditemukan",
  "description": "Halaman yang kamu cari tidak ada atau sudah dipindah.",
  "goHome": "Ke Beranda",
  "goLogin": "Masuk"
}
```

For `en.json`:
```json
"notFound": {
  "eyebrow": "404",
  "title": "Page not found",
  "description": "The page you're looking for doesn't exist or has been moved.",
  "goHome": "Go Home",
  "goLogin": "Sign In"
}
```

**Step 3: Verify**

- Navigate to a non-existent route like `/en/nonexistent` — should show branded 404
- Navigate to a non-existent wallet ID — should show branded 404 (`notFound()` from page.tsx will render this)

**Note:** The `notFound()` call already exists in `app/[locale]/(app)/wallets/[walletId]/page.tsx` (line 12: `notFound()`). This task ensures that call renders our branded page instead of Next.js default.

---

### Task 2: Root `error.tsx` — Catch-All Error Boundary

**Objective:** Create a global error boundary so unhandled errors in any route show a branded page instead of Next.js default stack trace

**Files:**
- Create: `app/[locale]/(app)/error.tsx`

**Step 1: Create the global error boundary**

Create `app/[locale]/(app)/error.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell
      currentPath=""
      title="Error"
      subtitle="Terjadi kesalahan"
      userName=""
      walletCount={0}
      budgetCount={0}
      memberCount={0}
      primaryWalletId=""
      currentWalletId=""
    >
      <section className="grid gap-4">
        <div className="card">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <h3 className="headline-md">Terjadi Kesalahan</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.
            </p>
            <div className="flex gap-2">
              <Button variant="soft" onClick={reset}>
                Coba Lagi
              </Button>
              <Button variant="ghost" href="/">
                Ke Beranda
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
```

**Step 2: Verify**

- The `(app)` group catches all authenticated routes. Any unhandled error in dashboard, wallets, settings, chat, etc. now shows branded UI
- Test by temporarily throwing in a page component

---

### Task 3: Route-Level `error.tsx` — Settings, Budgets, Savings, Dashboard

**Objective:** Add error boundaries for the most critical authenticated routes so each has a contextual error page with AppShell

**Files:**
- Create: `app/[locale]/(app)/dashboard/error.tsx`
- Create: `app/[locale]/(app)/settings/error.tsx`
- Create: `app/[locale]/(app)/wallets/[walletId]/budgets/error.tsx`
- Create: `app/[locale]/(app)/wallets/[walletId]/savings/error.tsx`

**Step 1: Create each error.tsx**

Each file follows the same pattern (example for dashboard):

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell
      currentPath="/dashboard"
      title="Dashboard"
      subtitle="Terjadi kesalahan"
      userName=""
      walletCount={0}
      budgetCount={0}
      memberCount={0}
      primaryWalletId=""
      currentWalletId=""
    >
      <section className="grid gap-4">
        <div className="card">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <h3 className="headline-md">Gagal Memuat Dashboard</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Maaf, terjadi kesalahan. Silakan coba lagi.
            </p>
            <div className="flex gap-2">
              <Button variant="soft" onClick={reset}>
                Coba Lagi
              </Button>
              <Button variant="ghost" href="/dashboard">
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
```

Create the other 3 with appropriate titles:
- Settings: `currentPath="/settings"` title="Settings"
- Budgets: `currentPath={`/wallets/${walletId}/budgets`}` — BUT wait, error.tsx in route groups don't have access to params directly. For wallet routes, use `currentPath=""` or use `usePathname()` from next/navigation.

Actually, for simplicity and consistency, use `"use client"` and `usePathname()`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { usePathname } from "next/navigation";

export default function BudgetsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  return (
    <AppShell
      currentPath={pathname}
      title="Anggaran"
      subtitle="Terjadi kesalahan"
      userName=""
      walletCount={0}
      budgetCount={0}
      memberCount={0}
      primaryWalletId=""
      currentWalletId=""
    >
      <section className="grid gap-4">
        <div className="card">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <h3 className="headline-md">Gagal Memuat Halaman</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Maaf, terjadi kesalahan. Silakan coba lagi.
            </p>
            <div className="flex gap-2">
              <Button variant="soft" onClick={reset}>
                Coba Lagi
              </Button>
              <Button variant="ghost" href="/dashboard">
                Ke Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
```

**Files to create (identical pattern, different title for each):**
1. `app/[locale]/(app)/dashboard/error.tsx` — title="Dashboard"
2. `app/[locale]/(app)/settings/error.tsx` — title="Settings"
3. `app/[locale]/(app)/wallets/[walletId]/budgets/error.tsx` — title="Anggaran"
4. `app/[locale]/(app)/wallets/[walletId]/savings/error.tsx` — title="Tabungan"

---

### Task 4: `next/image` — Optimize User Avatar Icons & App Icons

**Objective:** Migrate category icons, transaction item icons, and user avatar in the app shell to use `next/image` for automatic WebP conversion and lazy loading

**Files:**
- Modify: `app/next.config.ts` — add `images` config for remote patterns
- Modify: `components/ui/app-icon.tsx` — use next/image for icon rendering where applicable
- Modify: `components/app-shell.tsx` — use next/image for user avatar

**Step 1: Add `images` config to next.config.ts**

```ts
const nextConfig: NextConfig = {
  output: "standalone",

  // ❗ADD THIS:
  images: {
    // User-uploaded avatars from Supabase storage
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
    // Enable WebP and AVIF auto-optimization
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    // ... existing headers
  },
};
```

**Step 2: Update AppShell user avatar**

In `components/app-shell.tsx`, find the user avatar area. Replace `<img>` or inline SVG with:

```tsx
import Image from "next/image";

// Where user avatar is rendered:
{userAvatarUrl ? (
  <Image
    src={userAvatarUrl}
    alt={userName || "User avatar"}
    width={32}
    height={32}
    className="rounded-full object-cover"
    priority={false}
  />
) : (
  // Fallback initials avatar
  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
    {userInitials}
  </div>
)}
```

**Step 3: Verify**

- Check image optimization is working: inspect `_next/image` URLs in dev tools
- Confirm lazy loading behavior on scroll
- Confirm avatars in members list, transaction items use optimized images

---

### Task 5: Optimistic UI for Delete Transaction

**Objective:** Add `useOptimistic` to delete transaction flow so items disappear from UI immediately (rollback on server error)

**Files:**
- Modify: `components/features/transactions/transactions-page-content.tsx`

**Step 1: Modify the TransactionItem to support optimistic deletion**

The pattern: wrap the transactions list with `useOptimistic`, add a delete action that immediately removes the item from the displayed list.

```tsx
"use client";

// ADD import:
import { useOptimistic, startTransition } from "react";

// Inside the main component, after data fetch:
const [optimisticTransactions, removeOptimistic] = useOptimistic(
  transactions,
  (state, deletedId: string) => state.filter((t) => t.id !== deletedId)
);

// Wrap the delete handler:
const handleDelete = (formData: FormData) => {
  const transactionId = formData.get("transaction_id") as string;
  startTransition(() => {
    removeOptimistic(transactionId);
  });
  // The ActionForm will handle the server action as before
  // On error, the existing `useActionToastRefresh` will show error toast
  // but we need to add a refetch mechanism for rollback
};
```

**Detailed implementation:**

In `transactions-page-content.tsx`, the structure is:
1. The page component renders a list of `TransactionItem` components
2. Each `TransactionItem` has a delete form using `ActionForm` + `deleteTransaction`

The challenge: `useOptimistic` needs to work at the list level. The flow:

1. Move `useOptimistic` to the parent component that owns the transactions array
2. Pass `removeOptimistic` as a callback to each `TransactionItem`
3. The `TransactionItem`'s delete action calls `removeOptimistic(id)` via `startTransition` BEFORE submitting the server action
4. If the server action succeeds → `router.refresh()` syncs with server
5. If the server action fails → need to restore the item. The simplest approach: use `router.refresh()` on error to re-fetch the server state.

The cleanest approach:

```tsx
// In TransactionsPageContent (the parent):

const [optimisticTransactions, removeOptimisticTransaction] = useOptimistic(
  props.transactions,
  (state, deletedId: string) => state.filter((t) => t.id !== deletedId)
);

// Inline delete handler that does optimistic removal + server action
const handleOptimisticDelete = useCallback((transactionId: string) => {
  const formData = new FormData();
  formData.set("transaction_id", transactionId);
  formData.set("wallet_id", walletId);

  startTransition(async () => {
    removeOptimisticTransaction(transactionId);
    const result = await deleteTransaction(
      { status: "idle" },
      formData
    );
    if (result.status === "error") {
      // Show error — the next router.refresh() will restore the item
      pushToast({ tone: "error", description: result.message || "Gagal menghapus" });
    }
    router.refresh();
  });
}, [walletId, removeOptimisticTransaction, router]);
```

**NOTE:** This approach requires the transaction list be passed as a prop to child components. Since `TransactionItem` is already inside `TransactionsPageContent`, we can thread it through.

**Files to modify:**
- `components/features/transactions/transactions-page-content.tsx`:
  - Add `useOptimistic`, `useCallback`, `startTransition` imports
  - Add `useOptimistic` hook after receiving props
  - Replace `ActionForm` + `deleteTransaction` in the delete section with `handleOptimisticDelete`
  - Pass `optimisticTransactions` instead of `props.transactions` to the render loop

---

### Task 6: Undo Toast for Delete Transaction

**Objective:** Add a toast with "Undo" action when deleting a transaction, giving users a chance to recover within 5 seconds

**Files:**
- Modify: `components/features/transactions/transactions-page-content.tsx`

**Step 1: Add undo logic to delete handler**

After successful delete server-side, show toast with "Undo" button that calls `restoreTransaction`:

```tsx
const handleOptimisticDelete = useCallback(async (transactionId: string) => {
  const formData = new FormData();
  formData.set("transaction_id", transactionId);
  formData.set("wallet_id", walletId);

  startTransition(() => {
    removeOptimisticTransaction(transactionId);
  });

  const result = await deleteTransaction(
    { status: "idle" },
    formData
  );

  if (result.status === "error") {
    pushToast({ tone: "error", description: result.message || "Gagal menghapus" });
    router.refresh();
    return;
  }

  // Show undo toast
  const undoKey = `undo-delete-${transactionId}`;
  const toastId = toast.success("Transaksi dihapus", {
    description: "Kamu bisa batalkan dalam 5 detik",
    duration: 5000,
    action: {
      label: "Batalkan",
      onClick: async () => {
        // Re-create the transaction
        // ... need to find the deleted transaction data
      },
    },
  });

  // After 5 seconds, auto-refresh to sync
  setTimeout(() => router.refresh(), 5500);
}, [walletId, removeOptimisticTransaction, router]);
```

**NOTE:** For undo to work properly, we need to store the deleted transaction data before the delete call. We'll track it in a ref:

```tsx
const deletedTransactionRef = useRef<TransactionsPageData["transactions"][number] | null>(null);

const handleOptimisticDelete = useCallback(async (transaction: TransactionsPageData["transactions"][number]) => {
  deletedTransactionRef.current = transaction;
  // ... rest of logic
```

--- 

## Task Order Recommendation

| Order | Task | Impact | Effort |
|---|---|---|---|
| **1** | `not-found.tsx` — branded 404 | Low but visible | < 5 min |
| **2** | `error.tsx` — catch-all in `(app)/` | Medium — prevents raw errors | < 5 min |
| **3** | Route-level error.tsx (settings, budgets, savings, dashboard) | Medium — contextual error | < 10 min |
| **4** | `next/image` — avatar & icon optimization | Medium — perf gain | < 10 min |
| **5** | Optimistic UI for delete | Medium — UX polish | < 20 min |
| **6** | Undo toast for delete | Medium — UX polish | < 15 min |

**Plan complete.** Ready to execute step-by-step. Mau gue execute sekarang?
