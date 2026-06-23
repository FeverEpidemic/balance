# Hapus Tab Quick Input + Move Balance Adjustment ke Wallet Overview — Plan

> **For Hermes:** Execute task-by-task. Commit per task. Baca `DESIGN.md` sebelum styling.

**Goal:** Hapus tab "Quick Input" dari halaman Transactions, ganti jadi Recent Transactions sebagai default view. Pindahkan form Balance Adjustment ke Wallet Overview — ditampilkan sebagai section collapsible di bawah StatCard saldo. Header tetap punya tombol "Tambah Transaksi" + FAB.

**Architecture:** Dua file component utama berubah:
1. `transactions-page-content.tsx` — hapus tab toggle + form create + balance adjustment, keep hanya recent transactions list full-width
2. `wallet-overview-content.tsx` — tambah section "Sesuaikan Saldo" dengan Balance Adjustment form

**Data:** `getTransactionsPageData` di page.tsx tetap dipakai (categories masih dibutuhkan TransactionItem), tapi `TransactionsPageData.currentAvailableBalance` jadi gak dipakai di UI ini — gak masalah, biarin aja.

---

## Context

### Struktur sekarang (Transactions page)
```
┌─ glass-panel tab toggle ──────────────────────┐
│  [Quick Input]  |  Riwayat Lengkap             │
└────────────────────────────────────────────────┘
┌─ xl:grid-cols-[0.95fr_1.05fr] ────────────────┐
│  ┌─ card: Quick Input ────────────────────┐    │
│  │  TransactionCreateForm                 │    │
│  │  ───────────────────────               │    │
│  │  Balance Adjustment form               │    │
│  └────────────────────────────────────────┘    │
│  ┌─ card: Recent Transactions ────────────┐    │
│  │  Month filter                           │    │
│  │  TransactionItem list                   │    │
│  │  [Buka Riwayat Lengkap →]              │    │
│  └────────────────────────────────────────┘    │
└────────────────────────────────────────────────┘
```

### Struktur target (Transactions page)
```
┌─ card: Transaksi Terbaru ──────────────────────┐
│  Month filter  [Terapkan] [Reset]              │
│  ┌─ TransactionItem ───────────────────────┐   │
│  │  ...                                    │   │
│  └─────────────────────────────────────────┘   │
│  [Buka Riwayat Lengkap →]                       │
└────────────────────────────────────────────────┘
```

### Struktur target (Wallet Overview — tambahan)
```
┌─ StatCard: Saldo ─┐ ┌─ StatCard: Tabungan ─┐
│  Rp 5.240.000      │ │  Rp 1.200.000        │
└────────────────────┘ └──────────────────────┘

┌─ card: Sesuaikan Saldo (collapsible) ──────────┐
│  Saldo saat ini: Rp 5.240.000                  │
│  [Sesuaikan Saldo]                              │
│  ┌─ CollapsibleContent ─────────────────────┐  │
│  │  Saldo sebenarnya: [CurrencyInput]       │  │
│  │  Alasan: [input]                         │  │
│  │  Tanggal: [date]  Jam: [time]            │  │
│  │  [Simpan]                                 │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## Part 1: Hapus Quick Input dari Transactions

### Task 1.1: Hapus tab toggle + simplify layout

**Files:**
- Modify: `components/features/transactions/transactions-page-content.tsx`

**Perubahan:**

**A. Hapus tab toggle (lines 333-351)**
```typescript
// HAPUS blok ini:
{/* View toggle */}
<div className="mb-4">
  <div className="glass-panel inline-flex gap-1 rounded-2xl p-1.5">
    <Button ...> {t("transactions.quickInputTab")} </Button>
    <Button ...> {t("transactions.fullHistoryTab")} </Button>
  </div>
</div>
```

**B. Hapus grid dua kolom + card kiri (lines 353-401)**

Ganti dari:
```typescript
<section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
  <div className="card">
    {/* Quick Input + Balance Adjustment */}
  </div>
  <div className="card">
    {/* Recent Transactions */}
  </div>
</section>
```

Jadi:
```typescript
<section className="card">
  {/* Recent Transactions — full width */}
</section>
```

**C. Update header (line 341)**

Tab `quickInputTab` sudah dihapus. Tapi `fullHistoryTab` masih dipakai di history page — gak masalah, i18n key-nya tetap ada di file messages.

**Step: Typecheck**

```bash
npm run typecheck
```

Expected: FAIL (import unused — TransactionCreateForm, createBalanceAdjustment, dll). Di-fix task berikutnya.

---

### Task 1.2: Bersihin import yang gak dipakai

**Files:**
- Modify: `components/features/transactions/transactions-page-content.tsx`

Hapus import yang udah gak digunakan:

| Line | Import | Alasan |
|------|--------|--------|
| 3 | `createBalanceAdjustment` dari `@/app/actions/transactions` | Form adjustment pindah ke overview |
| 6 | `TransactionCreateForm` dari `./transaction-create-form` | Form create dihapus |
| 19 | `SubmitButton` dari `@/components/ui/submit-button` | Cek: masih dipakai di TransactionItem? TIDAK — SubmitButton dipakai di form create + adjustment. Di TransactionItem tetap pakai SubmitButton! Jadi JANGAN dihapus. |
| 22 | `getTranslator` dari `@/lib/i18n` | Masih dipakai |
| 23 | `formatCurrency, formatShortDate, formatTimeOfDay, getCurrentTimeString, getTodayDateString, toDateInputValue, toTimeInputValue` | Cek satu-satu: `getCurrentTimeString` dan `getTodayDateString` cuma dipakai di form adjustment. Sisanya dipakai TransactionItem. Jadi hapus `getCurrentTimeString` dan `getTodayDateString`. |

Yang pasti dihapus:
```typescript
// Line 3
import { createBalanceAdjustment, deleteTransaction, updateTransaction } from "@/app/actions/transactions";
// Jadi:
import { deleteTransaction, updateTransaction } from "@/app/actions/transactions";

// Line 6 — hapus
import { TransactionCreateForm } from "@/components/features/transactions/transaction-create-form";

// Line 23 — hapus getCurrentTimeString dan getTodayDateString
import { formatCurrency, formatShortDate, formatTimeOfDay, toDateInputValue, toTimeInputValue } from "@/lib/utils";
```

Juga hapus dari line 23: `getCurrentTimeString, getTodayDateString`

**Step: Typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step: Commit**

```bash
git add components/features/transactions/transactions-page-content.tsx
git commit -m "refactor: remove Quick Input tab, make Recent Transactions default"
```

---

### Task 1.3: Hapus import `ActionForm` kalau gak dipakai

Cek: `ActionForm` di-import di line 11. Apakah masih dipakai setelah Task 1.1-1.2?

Di TransactionItem nanti (setelah plan restyle), ActionForm dipakai di CollapsibleContent. Jadi KEEP import ActionForm.

Tapi `PullToRefresh` dan yang lain-lain cek lagi. Semua component di TransactionItem tetap dipakai.

**Step: Typecheck ulang + commit kalau ada perubahan**

---

## Part 2: Pindahkan Balance Adjustment ke Wallet Overview

### Task 2.1: Tambah section Balance Adjustment ke WalletOverviewContent

**Files:**
- Modify: `components/features/wallets/wallet-overview-content.tsx`

**Step 1: Tambah import**

```typescript
import { createBalanceAdjustment } from "@/app/actions/transactions";
import { ActionForm } from "@/components/ui/action-form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible";
import { useState } from "react";
import { formatCurrency, getCurrentTimeString, getTodayDateString } from "@/lib/utils";
import { useTimezone } from "@/components/providers/timezone-provider";
```

**Step 2: Tambah state + timezone di dalam komponen**

Setelah line 13 (`const active = ...`), tambah:
```typescript
const timezone = useTimezone();
const [adjustmentOpen, setAdjustmentOpen] = useState(false);
const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";
```

**Step 3: Tambah section setelah StatCards (setelah line 33 `</section>`)**

```tsx
{canMutate ? (
  <section className="mt-4">
    <Collapsible open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">{t("transactions.balanceAdjustmentEyebrow")}</p>
            <h3 className="headline-md mt-2">{t("transactions.balanceAdjustmentTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("transactions.balanceAdjustmentDescription")}
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant={adjustmentOpen ? "soft" : "ghost"}
            >
              {adjustmentOpen ? t("common.closeEditor") : t("transactions.editButton")}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <ActionForm
            action={createBalanceAdjustment}
            className="mt-4 border-t border-border pt-4"
            resetOnSuccess
            onSuccess={() => setAdjustmentOpen(false)}
          >
            <input type="hidden" name="wallet_id" value={data.walletId} />
            <div className="grid min-w-0 gap-4">
              <div className="glass-panel rounded-2xl p-4">
                <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {t("transactions.balanceAdjustmentRecordedBalanceLabel")}
                </p>
                <p className="metric mt-3 text-xl text-foreground">
                  {formatCurrency(data.wallet.availableBalance, locale, data.wallet.currency)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("transactions.balanceAdjustmentAutoDirectionHint")}
                </p>
              </div>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">
                  {t("transactions.balanceAdjustmentActualBalanceLabel")}
                </span>
                <CurrencyInput
                  allowNegative
                  name="actual_balance"
                  placeholder="Rp0"
                  required
                  currency={data.wallet.currency}
                />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">
                  {t("transactions.balanceAdjustmentReasonLabel")}
                </span>
                <input name="note" placeholder={t("transactions.balanceAdjustmentReasonPlaceholder")} required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">
                    {t("transactions.balanceAdjustmentDateLabel")}
                  </span>
                  <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">
                    {t("transactions.balanceAdjustmentTimeLabel")}
                  </span>
                  <input name="happened_at_time" type="time" defaultValue={getCurrentTimeString()} />
                </label>
              </div>
              <SubmitButton pendingText={t("transactions.balanceAdjustmentSavePending")}>
                {t("transactions.balanceAdjustmentSave")}
              </SubmitButton>
            </div>
          </ActionForm>
        </CollapsibleContent>
      </div>
    </Collapsible>
  </section>
) : null}
```

**Step 4: Tambah import Button**

```typescript
import { Button } from "@/components/ui/button";
```

**Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 6: Commit**

```bash
git add components/features/wallets/wallet-overview-content.tsx
git commit -m "feat: move balance adjustment form to wallet overview"
```

---

### Task 2.2: Hapus `currentAvailableBalance` dari TransactionsPage kalau udah gak dipakai

**Files:**
- Modify: `lib/data/types.ts` — `TransactionsPageData` (line 392-400)
- Modify: `lib/data/mappers.ts` — `createTransactionsPageData` (line 974-984)
- Modify: `lib/data/index.ts` — `getTransactionsPageData` (line 317)

**Step 1: Hapus dari type**

Di `types.ts`, hapus `currentAvailableBalance` dari `TransactionsPageData`:
```typescript
// Line 392, hapus: currentAvailableBalance: number;
```

**Step 2: Hapus dari mapper**

Di `mappers.ts`, hapus dari args dan return:
```typescript
// Line 965: hapus currentAvailableBalance dari args destructure
// Line 979: hapus currentAvailableBalance dari return object
```

**Step 3: Hapus dari data loader**

Di `index.ts`, hapus query + variable:
```typescript
// Line 303: hapus balanceRows dari Promise.all
// Line 308: hapus queryWalletBalances([walletId])
// Line 317: hapus const currentAvailableBalance = ...
// Line 325: hapus currentAvailableBalance dari createTransactionsPageData call
```

**Step 4: Typecheck + test**

```bash
npm run typecheck
npm run test
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/data/types.ts lib/data/mappers.ts lib/data/index.ts
git commit -m "chore: remove currentAvailableBalance from TransactionsPageData"
```

---

## Part 3: Full Verification

### Task 3.1: Build production

```bash
npm run build
```

Expected: No errors.

### Task 3.2: Run tests

```bash
npm run test
```

Expected: All pass.

### Task 3.3: Visual checklist

```bash
npm run dev
```

- [ ] `/wallets/[id]/transactions` — langsung tampil Recent Transactions (gak ada tab)
- [ ] `/wallets/[id]/transactions?view=history` — tetap tampil Full History
- [ ] Header Transactions — tombol "Tambah Transaksi" tetap muncul
- [ ] FAB "+" — tetap berfungsi buat create transaction
- [ ] `/wallets/[id]` (Wallet Overview) — section "Sesuaikan Saldo" muncul untuk owner/editor
- [ ] Balance adjustment di overview — form collapsible, bisa submit
- [ ] `/wallets/[id]` untuk role viewer — section adjustment TIDAK muncul
- [ ] Mobile — layout responsif, gak overflow
- [ ] Dark mode — semua elemen kontras

---

## Ringkasan File

| File | Perubahan |
|------|-----------|
| `components/features/transactions/transactions-page-content.tsx` | Hapus tab toggle, form create, balance adjustment. Simplifikasi jadi single-card Recent Transactions |
| `components/features/wallets/wallet-overview-content.tsx` | Tambah section "Sesuaikan Saldo" collapsible |
| `lib/data/types.ts` | Hapus `currentAvailableBalance` dari `TransactionsPageData` |
| `lib/data/mappers.ts` | Hapus `currentAvailableBalance` dari `createTransactionsPageData` |
| `lib/data/index.ts` | Hapus query `queryWalletBalances` dari `getTransactionsPageData` |

## Risks

| Risk | Mitigasi |
|------|----------|
| `queryWalletBalances` dihapus dari Transactions page — mungkin masih dipakai di tempat lain? | Function `queryWalletBalances` tetap ada di `lib/data/queries.ts`, cuma pemanggilannya di `index.ts` yang dihapus |
| `currentAvailableBalance` di-cache di Redis — stale? | Cache `getTransactionsPageData` diinvalidasi sama `invalidateWalletReadCaches` — gak masalah |
| Balance adjustment form di overview bikin page jadi kepanjangan | Form di-wrap dalam Collapsible — default tertutup |
| User gak nemu fitur balance adjustment | Di overview, section "Sesuaikan Saldo" langsung keliatan di bawah StatCard saldo |
