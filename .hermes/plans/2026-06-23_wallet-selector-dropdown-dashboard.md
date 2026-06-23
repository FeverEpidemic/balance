# Wallet Selector Dropdown di Dashboard Header

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Tambah dropdown wallet selector di header Dashboard untuk ganti wallet aktif tanpa navigasi.

**Architecture:** Server bangun `TransactionCreateContext` untuk semua wallet → client simpan di state `selectedWalletId` → FAB & konteks transaksi berubah sesuai wallet yang dipilih. Dropdown posisi dekat judul, tampilkan nama wallet aja.

**Tech Stack:** React (client component), shadcn Select (Radix), TypeScript, Tailwind CSS.

---

### Task 1: Tambah `allWalletContexts` ke `DashboardData` type

**Objective:** Bikin server bisa ngirim context transaksi untuk semua wallet.

**Files:**
- Modify: `lib/data/types.ts`

**Step 1: Tambah field ke DashboardData**

Di `lib/data/types.ts`, line 283-297 (`DashboardData`), tambah field `allWalletContexts` setelah `createTransactionContext`:

```ts
  allWalletContexts: Record<string, TransactionCreateContext>;
```

Jadi `DashboardData` jadi:

```ts
export type DashboardData = {
  shell: ShellData;
  onboarding: DashboardOnboarding;
  createTransactionContext: TransactionCreateContext | null; // tetap ada buat backward compat
  allWalletContexts: Record<string, TransactionCreateContext>; // baru: semua wallet
  totalAvailableBalance: number;
  // ... sisanya tetap
};
```

**Step 2: Commit**

```bash
git add lib/data/types.ts
git commit -m "feat: add allWalletContexts field to DashboardData type"
```

---

### Task 2: Build all wallet contexts di `createDashboardData`

**Objective:** Di mapper, bangun context transaksi untuk SEMUA wallet, bukan cuma primary.

**Files:**
- Modify: `lib/data/mappers.ts`

**Step 1: Buat helper function `buildAllWalletContexts`**

Di `lib/data/mappers.ts`, setelah function `buildTransactionCreateContext` (sekitar line 498), tambah:

```ts
function buildAllWalletContexts(args: {
  wallets: WalletRow[];
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
}): Record<string, TransactionCreateContext> {
  const { wallets, memberships, categories } = args;
  const result: Record<string, TransactionCreateContext> = {};

  for (const wallet of wallets) {
    const role = getCurrentUserRole(memberships, wallet.id);
    if (role !== "owner" && role !== "editor") {
      continue;
    }
    result[wallet.id] = {
      walletId: wallet.id,
      walletName: wallet.name,
      walletCurrency: wallet.currency,
      categories: buildTransactionCreateCategories(categories, wallet.id),
    };
  }

  return result;
}
```

**Step 2: Panggil dari `createDashboardData`**

Di `lib/data/mappers.ts`, sekitar line 894, setelah `createTransactionContext` dipanggil, tambah `allWalletContexts`:

```ts
    createTransactionContext: buildTransactionCreateContext({
      shell,
      wallets,
      memberships,
      categories
    }),
    allWalletContexts: buildAllWalletContexts({
      wallets,
      memberships,
      categories
    }),
```

**Step 3: Commit**

```bash
git add lib/data/mappers.ts
git commit -m "feat: build transaction contexts for all wallets in dashboard data"
```

---

### Task 3: Tambah wallet selector dropdown di DashboardContent

**Objective:** Tambah dropdown Select di dashboard header, dekat judul, pake shadcn Select component.

**Files:**
- Modify: `components/features/dashboard/dashboard-content.tsx`

**Step 1: Tambah import**

Di `components/features/dashboard/dashboard-content.tsx`, tambah import Select setelah import yang udah ada:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { useState, useMemo } from "react";
```

(Note: `useState` dan `useMemo` sudah di-import dari react? Cek dulu — kalo baru satu-dua, tambahin di import `react` yang udah ada.)

**Step 2: Tambah state selectedWalletId**

Di dalam function `DashboardContent`, setelah line 35 (`const transactionsHref = ...`), tambah:

```tsx
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(
    dashboard.shell.primaryWalletId
  );
```

**Step 3: Build selected context dari allWalletContexts**

Setelah state, tambah:

```tsx
  const selectedCreateContext = useMemo(() => {
    if (!selectedWalletId) return null;
    return dashboard.allWalletContexts[selectedWalletId] ?? null;
  }, [selectedWalletId, dashboard.allWalletContexts]);
```

**Step 4: Tambah dropdown di headerBody**

Di dalam prop `headerBody` (sekitar line 51-63), **sebelum** balance display, tambah wallet selector:

```tsx
      headerBody={
        <div className="max-w-3xl">
          {/* Wallet selector — dekat judul */}
          {dashboard.wallets.length > 0 ? (
            <div className="mb-4">
              <Select
                value={selectedWalletId ?? undefined}
                onValueChange={(value) => setSelectedWalletId(value)}
              >
                <SelectTrigger className="w-full max-w-xs h-9 text-sm bg-muted border-soft-border">
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  {dashboard.wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <SelectItemText>{wallet.name}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Balance display — existing */}
          <p className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong">
            {t("dashboard.availableBalanceLabel")}
          </p>
          <p className="metric mt-3 text-[2.15rem] leading-none text-foreground sm:text-[2.8rem] md:text-[3.4rem]">
            {formatCurrency(dashboard.totalAvailableBalance)}
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-sm">
            {t("dashboard.availableBalanceDetail")}
          </p>
        </div>
      }
```

**Step 5: Update FAB transaction context ke selected**

Ganti `fabTransactionContext={dashboard.createTransactionContext ?? undefined}` di line 50 jadi:

```tsx
      fabTransactionContext={selectedCreateContext ?? undefined}
```

**Step 6: Update headerAction context juga**

Ganti `context={dashboard.createTransactionContext}` di dalam `headerAction` (sekitar line 64-68) dengan:

```tsx
      headerAction={
        selectedCreateContext ? (
          <TransactionCreateDialogButton context={selectedCreateContext} label={t("dashboard.addTransaction")} />
        ) : null
      }
```

**Step 7: Commit**

```bash
git add components/features/dashboard/dashboard-content.tsx
git commit -m "feat: add wallet selector dropdown to dashboard header"
```

---

### Task 4: CSS polish & dark mode support

**Objective:** Styling dropdown agar cocok dengan "Serene Capital" design language di light & dark mode.

**Files:**
- Modify: `components/features/dashboard/dashboard-content.tsx`

**Step 1: Sesuaikan className SelectTrigger**

Update className di `SelectTrigger` biar lebih matching:

```tsx
<SelectTrigger className="w-full max-w-xs h-9 px-3 text-sm font-medium rounded-lg border border-[color:var(--soft-border)] bg-muted text-foreground hover:bg-muted/80 transition-colors">
  <SelectValue placeholder={t("dashboard.selectWallet")} />
</SelectTrigger>
```

**Step 2: Tambah i18n key**

Di file i18n (`lib/i18n/translations/id.ts` atau yang sesuai), tambah key:

```
dashboard.selectWallet: "Pilih dompet"
```

Jangan lupa juga untuk `en.ts`.

**Step 3: Commit**

```bash
git add components/features/dashboard/dashboard-content.tsx lib/i18n/translations/id.ts lib/i18n/translations/en.ts
git commit -m "style: polish wallet selector styles and add i18n keys"
```

---

### Task 5: Verifikasi

**Files:**
- Semua file yang disentuh

**Verification steps:**

1. **Type check:**
   ```bash
   npm run typecheck
   ```
   Expected: 0 errors.

2. **Unit tests:**
   ```bash
   npm run test
   ```
   Expected: all passing.

3. **Build:**
   ```bash
   npm run build
   ```
   Expected: build success.

4. **Manual visual check:**
   - Dashboard dengan 1 wallet → dropdown muncul, cuma 1 opsi
   - Dashboard dengan 3+ wallet → dropdown muncul, semua nama wallet tampil
   - Pilih wallet A → FAB create transaction pakai wallet A
   - Pilih wallet B → FAB create transaction pakai wallet B
   - Refresh halaman → selectedWalletId reset ke primaryWalletId (expected: session-only, no persistence)
   - Dark mode → dropdown tetap readable
   - Mobile → dropdown tetap usable
   - Dashboard tanpa wallet → dropdown tidak muncul (handled by `wallets.length > 0` guard)

---

### Summary

| File | Change | Line delta |
|------|--------|------------|
| `lib/data/types.ts` | +1 field di `DashboardData` | +1 |
| `lib/data/mappers.ts` | +1 helper function, +3 lines di `createDashboardData` | ~+20 |
| `components/features/dashboard/dashboard-content.tsx` | +import, +state, +Select UI, ganti context | ~+30 |
| `lib/i18n/translations/id.ts` | +1 key `dashboard.selectWallet` | +1 |
| `lib/i18n/translations/en.ts` | +1 key `dashboard.selectWallet` | +1 |

**Total: ~53 lines changed across 5 files.**

### Preserved functionality (unchanged):

- Dashboard aggregates & stat cards tetap sama (agregat semua wallet)
- Sidebar navigation tetap pakai `primaryWalletId`
- Halaman wallet (overview, transactions, etc.) TIDAK disentuh
- `createTransactionContext` di `DashboardData` tetap ada (backward compat)
- Logout, greeting, stats card (wallet/budget/member count) tidak berubah
- Mobile bottom nav tidak berubah
- Semua server action / cache invalidation tidak berubah
