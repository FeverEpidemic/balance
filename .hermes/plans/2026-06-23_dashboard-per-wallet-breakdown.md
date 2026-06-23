# Dashboard Data Per-Wallet — Breakdown & Filtering

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Dashboard menampilkan data mengikuti wallet yang dipilih. Pilih "Semua Dompet" → tampil agregat (current). Pilih wallet spesifik → semua stat card, chart, dan transaksi menampilkan data wallet itu saja.

**Architecture:** Server bangun `walletBreakdowns: Record<string, WalletDashboardBreakdown>` berisi per-wallet aggregate + categorySpend + dailyExpenses. Client-side pilih breakdown berdasarkan `selectedWalletId`. `selectedWalletId = null` → pakai data agregat level atas. Chart & recent transactions difilter client-side. Switch instant, tidak ada refetch/refresh.

**Tech Stack:** React (client component), TypeScript, Recharts.

---

## Task 1: Tambah `walletId` ke `DashboardCategorySpend` dan `DailyExpenseItem`

**Objective:** Biar client bisa filter chart data per wallet.

**Files:**
- Modify: `lib/data/types.ts`

**Step 1: Tambah `walletId` di `DashboardCategorySpend`**

Di `lib/data/types.ts`, sekitar line 261-265, tambah field `walletId`:

```ts
export type DashboardCategorySpend = {
  walletId: string;   // baru
  name: string;
  value: number;
  color: string;
};
```

**Step 2: Tambah `walletId` di `DailyExpenseItem`**

Di `lib/data/types.ts`, sekitar line 274-280, tambah field `walletId`:

```ts
export type DailyExpenseItem = {
  walletId: string;   // baru
  day: number;
  dayLabel: string;
  date: string;
  amount: number;
  isToday: boolean;
};
```

**Step 3: Commit**

```bash
git add lib/data/types.ts
git commit -m "feat: add walletId to DashboardCategorySpend and DailyExpenseItem"
```

---

## Task 2: Tambah `WalletDashboardBreakdown` type dan field `walletBreakdowns` di `DashboardData`

**Objective:** Type untuk per-wallet breakdown data.

**Files:**
- Modify: `lib/data/types.ts`

**Step 1: Tambah type `WalletDashboardBreakdown`**

Di `lib/data/types.ts`, sebelum `DashboardData` (sekitar line 280), tambah:

```ts
export type WalletDashboardBreakdown = {
  totalAvailableBalance: number;
  totalAvailableBudget: number;
  totalSavingBalance: number;
  totalBalance: number;
  totalExpenseThisMonth: number;
  totalIncomeThisMonth: number;
  outstandingSplit: number;
  categorySpend: DashboardCategorySpend[];
  dailyExpenses: DailyExpenseItem[];
  recentTransactions: DashboardRecentTransaction[];
};
```

**Step 2: Tambah field `walletBreakdowns` ke `DashboardData`**

Di `DashboardData`, tambah setelah `allWalletContexts`:

```ts
export type DashboardData = {
  // ... existing fields ...
  allWalletContexts: Record<string, TransactionCreateContext>;
  walletBreakdowns: Record<string, WalletDashboardBreakdown>;  // baru
  // ... rest of fields ...
};
```

**Step 3: Commit**

```bash
git add lib/data/types.ts
git commit -m "feat: add WalletDashboardBreakdown type and walletBreakdowns field"
```

---

## Task 3: Build per-wallet breakdowns di `createDashboardData`

**Objective:** Server compute per-wallet aggregates, categorySpend, dailyExpenses, dan filter recentTransactions.

**Files:**
- Modify: `lib/data/mappers.ts`

**Step 1: Bikin helper function `buildWalletBreakdown`**

Di `lib/data/mappers.ts`, setelah function `buildAllWalletContexts` (Task 2 dari plan sebelumnya), tambah:

```ts
function buildWalletBreakdown(args: {
  walletId: string;
  memberships: WalletMemberRow[];
  wallets: WalletRow[];
  memberRows: WalletMemberRow[];
  budgets: BudgetRow[];
  monthTransactions: TransactionRow[];
  recentTransactions: TransactionRow[];
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  categories: CategoryRow[];
  splits: TransactionSplitRow[];
  balancesByWallet?: Map<string, number>;
  month: string;
  locale: AppLocale;
}): WalletDashboardBreakdown {
  const {
    walletId,
    memberships,
    wallets,
    memberRows,
    budgets,
    monthTransactions,
    recentTransactions,
    savings,
    savingEntries,
    categories,
    splits,
    balancesByWallet,
    month,
    locale
  } = args;

  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) {
    return {
      totalAvailableBalance: 0,
      totalAvailableBudget: 0,
      totalSavingBalance: 0,
      totalBalance: 0,
      totalExpenseThisMonth: 0,
      totalIncomeThisMonth: 0,
      outstandingSplit: 0,
      categorySpend: [],
      dailyExpenses: [],
      recentTransactions: []
    };
  }

  // Filter data to this wallet
  const walletMonthTransactions = monthTransactions.filter((tx) => tx.wallet_id === walletId);
  const walletRecentTransactions = recentTransactions.filter((tx) => tx.wallet_id === walletId);
  const walletSplits = splits.filter((s) => s.wallet_id === walletId);
  const walletBudgets = budgets.filter((b) => b.wallet_id === walletId);
  const walletCategories = categories.filter((c) => c.wallet_id === walletId);
  const walletSavings = savings.filter((s) => s.wallet_id === walletId);
  const walletSavingEntries = savingEntries.filter((s) => s.wallet_id === walletId);
  const walletMemberRows = memberRows.filter((m) => m.wallet_id === walletId);

  // Build wallet summary for numeric aggregates
  const [summary] = buildWalletSummaries({
    memberships,
    wallets: [wallet],
    memberRows: walletMemberRows,
    transactions: walletMonthTransactions,
    savings: walletSavings,
    savingEntries: walletSavingEntries,
    budgets: walletBudgets,
    balancesByWallet,
    month,
    locale
  });

  return {
    totalAvailableBalance: summary.availableBalance,
    totalAvailableBudget: summary.budgetThisMonth > 0 ? summary.budgetThisMonth - summary.spentThisMonth : 0,
    totalSavingBalance: summary.savingBalance,
    totalBalance: summary.totalBalance,
    totalExpenseThisMonth: walletMonthTransactions.filter((tx) => tx.kind === "expense").reduce((sum, tx) => sum + tx.amount, 0),
    totalIncomeThisMonth: walletMonthTransactions.filter((tx) => tx.kind === "income").reduce((sum, tx) => sum + tx.amount, 0),
    outstandingSplit: walletSplits.reduce((sum, s) => sum + Math.max(s.owed_amount - s.paid_amount, 0), 0),
    categorySpend: buildCategorySpend(walletMonthTransactions, walletCategories, locale).map((cs) => ({
      ...cs,
      walletId
    })),
    dailyExpenses: buildDailyExpenses(walletMonthTransactions, month).map((de) => ({
      ...de,
      walletId
    })),
    recentTransactions: buildRecentTransactions(walletRecentTransactions, walletCategories, [wallet], locale)
  };
}
```

**Step 2: Panggil `buildWalletBreakdown` di `createDashboardData`**

Di `lib/data/mappers.ts`, di dalam `createDashboardData`, setelah line `allWalletContexts`, tambah:

```ts
    allWalletContexts: buildAllWalletContexts({
      wallets,
      memberships,
      categories
    }),
    walletBreakdowns: Object.fromEntries(
      wallets.map((wallet) => [
        wallet.id,
        buildWalletBreakdown({
          walletId: wallet.id,
          memberships,
          wallets,
          memberRows,
          budgets,
          monthTransactions,
          recentTransactions,
          savings,
          savingEntries,
          categories,
          splits,
          balancesByWallet,
          month,
          locale
        })
      ])
    ),
```

**Step 3: Pastikan `categorySpend` dan `dailyExpenses` di level atas juga di-tag `walletId`**

Di return statement `createDashboardData`, update:

```ts
    categorySpend: buildCategorySpend(currentMonthTransactions, categories, locale).map((cs) => ({
      ...cs,
      walletId: ""  // aggregate, no specific wallet
    })),
    dailyExpenses: buildDailyExpenses(currentMonthTransactions, month).map((de) => ({
      ...de,
      walletId: ""  // aggregate, no specific wallet
    })),
```

**Step 4: Commit**

```bash
git add lib/data/mappers.ts
git commit -m "feat: compute per-wallet dashboard breakdowns in mapper"
```

---

## Task 4: Update `DashboardContent` — pilih breakdown + filter semua data

**Objective:** Client-side: pilih breakdown, filter stat cards, chart, recent transactions.

**Files:**
- Modify: `components/features/dashboard/dashboard-content.tsx`

**Step 1: Tambah "Semua Dompet" option di dropdown**

Di `headerBody`, update Select — tambah item pertama "Semua Dompet" dengan value kosong:

```tsx
<Select
  value={selectedWalletId ?? "__all__"}
  onValueChange={(value) => setSelectedWalletId(value === "__all__" ? null : value)}
>
  <SelectTrigger className="w-full max-w-xs h-9 px-3 text-sm font-medium rounded-lg border border-[color:var(--soft-border)] bg-muted text-foreground hover:bg-muted/80 transition-colors">
    <SelectValue placeholder={t("dashboard.selectWallet")} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="__all__">
      <SelectItemText>{t("dashboard.allWallets")}</SelectItemText>
    </SelectItem>
    {dashboard.wallets.map((wallet) => (
      <SelectItem key={wallet.id} value={wallet.id}>
        <SelectItemText>{wallet.name}</SelectItemText>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Step 2: Build `activeData` — pilih breakdown atau agregat**

Setelah `selectedCreateContext`, tambah memo:

```tsx
  const activeData = useMemo(() => {
    if (!selectedWalletId || !dashboard.walletBreakdowns[selectedWalletId]) {
      // "Semua Dompet" → aggregate
      return {
        totalAvailableBalance: dashboard.totalAvailableBalance,
        totalAvailableBudget: dashboard.totalAvailableBudget,
        totalSavingBalance: dashboard.totalSavingBalance,
        totalBalance: dashboard.totalBalance,
        totalExpenseThisMonth: dashboard.totalExpenseThisMonth,
        totalIncomeThisMonth: dashboard.totalIncomeThisMonth,
        outstandingSplit: dashboard.outstandingSplit,
        recentTransactions: dashboard.recentTransactions,
        categorySpend: dashboard.categorySpend,
        dailyExpenses: dashboard.dailyExpenses,
      };
    }
    const bd = dashboard.walletBreakdowns[selectedWalletId];
    return {
      totalAvailableBalance: bd.totalAvailableBalance,
      totalAvailableBudget: bd.totalAvailableBudget,
      totalSavingBalance: bd.totalSavingBalance,
      totalBalance: bd.totalBalance,
      totalExpenseThisMonth: bd.totalExpenseThisMonth,
      totalIncomeThisMonth: bd.totalIncomeThisMonth,
      outstandingSplit: bd.outstandingSplit,
      recentTransactions: bd.recentTransactions,
      categorySpend: bd.categorySpend,
      dailyExpenses: bd.dailyExpenses,
    };
  }, [selectedWalletId, dashboard]);
```

**Step 3: Update semua pemakaian `dashboard.*` jadi `activeData.*`**

Ganti semua reference ke aggregate data:

- **headerBody balance:**
  ```tsx
  {formatCurrency(activeData.totalAvailableBalance)}
  ```

- **StatCard section (line 76-81):**
  ```tsx
  <StatCard label={...} value={activeData.totalAvailableBudget} ... />
  <StatCard label={...} value={activeData.totalSavingBalance} ... />
  <StatCard label={...} value={activeData.outstandingSplit} ... />
  <StatCard label={...} value={activeData.totalExpenseThisMonth} ... />
  <StatCard label={...} value={activeData.totalIncomeThisMonth} ... />
  ```

- **DashboardCategoryBreakdown:**
  ```tsx
  <DashboardCategoryBreakdown categories={activeData.categorySpend} />
  ```

- **DashboardDailyExpenseChart:**
  ```tsx
  <DashboardDailyExpenseChart dailyExpenses={activeData.dailyExpenses} locale={locale} />
  ```

- **Recent transactions section:**
  ```tsx
  {activeData.recentTransactions.map((transaction) => (...))}
  ```

**Step 4: Update `hasDailyExpenses` check**

```tsx
  const hasDailyExpenses = activeData.dailyExpenses.some((item) => item.amount > 0);
```

**Step 5: Hide wallet cards ketika wallet spesifik dipilih**

Di section "Active Wallet" (sekitar line 101-205 di file asli), wrap dengan conditional:

```tsx
      {/* Wallet cards — only show when "Semua Dompet" is selected */}
      {!selectedWalletId ? (
        <section>
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">{t("dashboard.activeWalletEyebrow")}</p>
                <h3 className="headline-md mt-2">{t("dashboard.activeWalletTitle")}</h3>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-4">
              {/* ... existing wallet cards mapping ... */}
            </div>
          </div>
        </section>
      ) : null}
```

**Step 6: Tambah link navigasi ke overview wallet di samping dropdown**

Di `headerBody`, setelah dropdown, tambah link menuju overview wallet yang dipilih:

```tsx
          {/* Wallet selector */}
          {dashboard.wallets.length > 0 ? (
            <div className="mb-4 flex items-center gap-3">
              <Select ...>
                ...
              </Select>
              {selectedWalletId ? (
                <Button
                  href={`/wallets/${selectedWalletId}`}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full text-xs"
                >
                  {t("dashboard.openWallet")} →
                </Button>
              ) : null}
            </div>
          ) : null}
```

**Step 7: Tambah i18n key `dashboard.openWallet`**

Di `messages/id.json`:

```json
"openWallet": "Buka dompet",
```

Di `messages/en.json`:

```json
"openWallet": "Open wallet",
```

**Step 8: Commit**

```bash
git add components/features/dashboard/dashboard-content.tsx messages/id.json messages/en.json
git commit -m "feat: switch dashboard data per wallet, hide wallet cards when filtered, add open-wallet link"
```

---

## Task 5: Tambah i18n key "Semua Dompet"

**Objective:** Key "Semua Dompet" / "All Wallets" di dropdown.

**Files:**
- Modify: `messages/id.json`
- Modify: `messages/en.json`

Catatan: `dashboard.selectWallet` sudah ada di id.json line 389.

**Step 1: Tambah `dashboard.allWallets`**

Di `messages/id.json`, di dalam objek `dashboard`, tambah setelah `selectWallet`:

```json
"allWallets": "Semua Dompet",
```

Di `messages/en.json`, di dalam objek `dashboard`, tambah:

```json
"allWallets": "All Wallets",
```

**Step 2: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "feat: add dashboard.allWallets i18n key"
```

---

## Task 6: Typecheck, test, dan build

**Objective:** Verifikasi semua perubahan.

**Files:** N/A (verification only)

**Step 1: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

**Step 2: Unit test**

```bash
npm run test
```
Expected: all passing.

**Step 3: Build**

```bash
npm run build
```
Expected: build success.

**Step 4: Manual visual checklist**

- [ ] Dashboard dengan 3 wallet → dropdown muncul, "Semua Dompet" + 3 nama wallet
- [ ] Pilih "Semua Dompet" → semua stat card, chart, dan recent transactions = agregat (perilaku existing)
- [ ] Pilih wallet A → stat card berubah ke data wallet A, chart hanya kategori wallet A, daily expenses hanya transaksi wallet A, recent transactions hanya dari wallet A
- [ ] Pilih wallet B → semua berubah ke data wallet B
- [ ] FAB create transaction → pakai context wallet yang dipilih
- [ ] Refresh → kembali ke "Semua Dompet" (selectedWalletId = null)
- [ ] Mobile view → dropdown tetap accessible
- [ ] Dark mode → dropdown + semua chart tetap readable
- [ ] Wallet tanpa transaksi → chart kosong / empty state muncul

---

## Summary

| File | Change | Line delta |
|------|--------|------------|
| `lib/data/types.ts` | +`walletId` di 2 type, +`WalletDashboardBreakdown`, +1 field di `DashboardData` | ~+20 |
| `lib/data/mappers.ts` | +`buildWalletBreakdown` helper, +`walletBreakdowns` di `createDashboardData`, tag `walletId` di aggregate | ~+90 |
| `components/features/dashboard/dashboard-content.tsx` | +dropdown "Semua Dompet", +`activeData` memo, ganti semua aggregate → activeData, hide wallet cards, +link "Buka dompet" | ~+75 |
| `messages/id.json` | +2 keys: `dashboard.allWallets`, `dashboard.openWallet` | +2 |
| `messages/en.json` | +2 keys: `dashboard.allWallets`, `dashboard.openWallet` | +2 |

**Total: ~189 lines across 5 files. 6 tasks.**

### UX flow

| Dropdown | Stat cards | Chart | Wallet cards | Recent tx | Link |
|----------|-----------|-------|-------------|-----------|------|
| "Semua Dompet" | Agregat semua wallet | Agregat | ✅ Tampil | Semua wallet | — |
| "Dompet A" | Data Dompet A | Dompet A | ❌ Hidden | Dompet A | "Buka dompet" →`/wallets/A` |

### Preserved functionality (unchanged):

- Sidebar navigation tidak berubah
- Halaman wallet (overview, transactions, dll.) tidak disentuh
- AI Insight tetap fetch dari API terpisah (tidak difilter)
- Onboarding card tidak berubah
- Wallet create card tidak berubah
- Semua server action / cache invalidation tidak berubah
- `createTransactionContext` di level atas DashboardData tetap ada (backward compat)
- Mobile bottom nav tidak berubah
