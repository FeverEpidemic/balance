# Transaction Edit Dialog — Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to implement this plan task-by-task.

**Goal:** Ganti inline collapsible editor di halaman Transactions jadi dialog modal (kayak di halaman History), tampilan lebih premium & konsisten antar halaman.

**Architecture:** Extract `TransactionEditDialog` dari `transaction-history-page-content.tsx` ke komponen shared, lalu pakai ulang di `transactions-page-content.tsx`. Dua halaman pakai komponen yang sama, tipe data identik (`TransactionListItem`, `CategoryRow[]`).

**Tech Stack:** React, TypeScript, Tailwind CSS, Radix Dialog (via `components/ui/dialog.tsx`), `ActionForm` + `updateTransaction` server action.

---

## ASCII Layout Diagrams

### Sebelum (current) — Inline Collapsible Editor

```
┌──────────────────────────────────────────┐
│  (🍔)  Makan Siang      [EXPENSE]        │
│        Makanan / Food                    │
│                        -Rp 45.000        │
│                        12 Mar • 13:30    │
├──────────────────────────────────────────┤
│  [Hapus]                    [Ubah]   ▼   │  ← CollapsibleTrigger
├──────────────────────────────────────────┤
│  ▼ EXPANDED FORM (inline):              │
│  ┌────────────┬────────────┐            │
│  │ Kind: ____ │ Category:_ │            │
│  │ Amount:___ │ Note:_____ │            │
│  │ Date:_____ │ Time:_____ │            │
│  ├────────────┴────────────┤            │
│  │ [Perbarui]              │            │
│  └─────────────────────────┘            │
└──────────────────────────────────────────┘
```

### Sesudah (new) — Dialog Modal

```
┌──────────────────────────────────────────┐
│  (🍔)  Makan Siang      [EXPENSE]        │
│        Makanan / Food                    │
│                        -Rp 45.000        │
│                        12 Mar • 13:30    │
├──────────────────────────────────────────┤
│  [Hapus]                    [✏️ Edit]    │  ← opens dialog
└──────────────────────────────────────────┘

              ┌── Dialog Overlay ──┐
              │  ┌──────────────┐  │
              │  │ Ubah Transaksi│  │  ← DialogTitle
              │  │ Perbarui...   │  │  ← DialogDescription
              │  │               │  │
              │  │ Kind: [____]  │  │
              │  │ Kategori:[_]  │  │
              │  │ Nominal:[___] │  │
              │  │ Catatan:[___] │  │
              │  │ Tanggal:[___] │  │
              │  │ Waktu:  [___] │  │
              │  │               │  │
              │  │ [Simpan Perubahan]│  │
              │  └──────────────┘  │
              └────────────────────┘
```

---

## Step-by-Step Plan

### Task 1: Create shared `TransactionEditDialog` component

**Objective:** Extract komponen dialog dari history page ke file sendiri.

**Files:**
- **Create:** `components/features/transactions/transaction-edit-dialog.tsx`
- **Modify:** `components/features/transactions/transaction-history-page-content.tsx`

**Step 1: Create new file**

```bash
touch components/features/transactions/transaction-edit-dialog.tsx
```

**Step 2: Write extracted component**

Copy-paste `TransactionEditDialog` function dari history page (lines 57-135) ke file baru, lalu bungkus dengan imports yang diperlukan.

File: `components/features/transactions/transaction-edit-dialog.tsx`

```tsx
"use client";

import { useState } from "react";
import { updateTransaction } from "@/app/actions/transactions";
import { useTimezone } from "@/components/providers/timezone-provider";
import { ActionForm } from "@/components/ui/action-form";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "@/components/ui/category-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TransactionListItem } from "@/lib/data";
import type { CategoryRow } from "@/lib/data/types";
import { getTranslator } from "@/lib/i18n";
import { toDateInputValue, toTimeInputValue } from "@/lib/utils";

export function TransactionEditDialog({
  categories,
  transaction,
  walletId,
  t
}: {
  categories: CategoryRow[];
  transaction: TransactionListItem;
  walletId: string;
  t: ReturnType<typeof getTranslator>;
}) {
  const [open, setOpen] = useState(false);
  const timezone = useTimezone();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="min-h-[2.35rem] rounded-lg px-3 text-xs">
          <span className="inline-flex items-center gap-2">
            <AppIcon name="edit" className="h-3.5 w-3.5" tone="primary" />
            <span>{t("transactions.edit")}</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.editTitle")}</DialogTitle>
          <DialogDescription>{t("transactions.editDescription")}</DialogDescription>
        </DialogHeader>
        <ActionForm
          key={`edit-tx-${transaction.id}-${open}`}
          action={updateTransaction}
          className="mt-5 grid min-w-0 gap-4"
          onSuccess={() => setOpen(false)}
        >
          <input type="hidden" name="wallet_id" value={walletId} />
          <input type="hidden" name="transaction_id" value={transaction.id} />
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.kindLabel")}</span>
            <select name="kind" defaultValue={transaction.kind}>
              <option value="expense">{t("transactions.kindExpense")}</option>
              <option value="income">{t("transactions.kindIncome")}</option>
            </select>
          </label>
          {transaction.isBalanceAdjustment ? (
            <div className="glass-panel rounded-xl p-3 text-sm text-muted-foreground">
              {t("transactions.adjustmentCategoryManaged")}
            </div>
          ) : (
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.categoryLabel")}</span>
              <CategorySelect
                name="category_id"
                categories={categories}
                defaultValue={transaction.categoryId ?? ""}
                includeEmptyOption
                emptyLabel={t("common.noCategory")}
              />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.amountLabel")}</span>
            <CurrencyInput name="amount" defaultValue={transaction.amount} required />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.noteLabel")}</span>
            <input name="note" defaultValue={transaction.note ?? ""} placeholder={t("transactions.notePlaceholder")} />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.dateLabel")}</span>
            <input name="happened_at" type="date" defaultValue={toDateInputValue(transaction.happenedAt)} required />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.timeLabel")}</span>
            <input name="happened_at_time" type="time" defaultValue={toTimeInputValue(transaction.happenedAt, timezone)} />
          </label>
          <SubmitButton pendingText={t("transactions.savePending")} variant="soft">
            {t("transactions.saveChanges")}
          </SubmitButton>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Update history page — import dari shared file, hapus definisi lokal**

Di `transaction-history-page-content.tsx`:

- **Add import** (after existing dialog import line):
  ```tsx
  import { TransactionEditDialog } from "@/components/features/transactions/transaction-edit-dialog";
  ```

- **Remove:** `Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger` dari import di line 22 (kalau tidak dipakai di tempat lain — cek: ini hanya dipakai oleh `TransactionEditDialog` yang sekarang udah dipindah).

- **Remove:** `CategorySelect`, `CurrencyInput`, `SubmitButton` dari imports kalau hanya dipakai di `TransactionEditDialog` (cek: `CategorySelect` tidak dipakai di tempat lain di file ini. `CurrencyInput` tidak. `SubmitButton` tidak.)

- **Remove:** `toDateInputValue`, `toTimeInputValue` dari import `@/lib/utils` kalau hanya dipakai di `TransactionEditDialog` (cek: tidak dipakai di tempat lain di file ini).

- **Remove:** `updateTransaction` dari import kalau hanya dipakai di `TransactionEditDialog` (cek: tidak dipakai di tempat lain di file ini).

- **Remove:** `useTimezone` dari import kalau hanya dipakai di `TransactionEditDialog` (cek: dipakai juga di `HistoryMobileCard` — **jangan dihapus**).

- **Remove:** seluruh definisi fungsi `TransactionEditDialog` (lines 57-135).

- **Remove:** `useState` dari React import kalau tidak dipakai lagi (cek: tidak dipakai di tempat lain di file ini).

**Step 4: Commit**

```bash
git add components/features/transactions/transaction-edit-dialog.tsx components/features/transactions/transaction-history-page-content.tsx
git commit -m "refactor: extract TransactionEditDialog to shared component"
```

---

### Task 2: Replace collapsible editor with dialog in Transactions page

**Objective:** Ganti `Collapsible` + inline form di `TransactionItem` dengan `TransactionEditDialog`.

**Files:**
- **Modify:** `components/features/transactions/transactions-page-content.tsx`

**Step 1: Add import**

```tsx
import { TransactionEditDialog } from "@/components/features/transactions/transaction-edit-dialog";
```

**Step 2: Remove unused imports**

Karena `Collapsible` + `ActionForm` + `SubmitButton` tidak lagi dipakai di `TransactionItem` (cek sebelum hapus — `ActionForm` masih dipakai untuk delete button. `SubmitButton` tidak dipakai di tempat lain. `CurrencyInput` tidak dipakai di tempat lain. `CategorySelect` tidak dipakai di tempat lain. `toDateInputValue`, `toTimeInputValue` tidak dipakai di tempat lain.)

Yang aman dihapus:
- `Collapsible, CollapsibleContent, CollapsibleTrigger` dari import shadcn
- `CategorySelect` (tidak dipakai di `TransactionsPageContent`)
- `CurrencyInput` (tidak dipakai di `TransactionsPageContent`)
- `SubmitButton` (tidak dipakai di `TransactionsPageContent`)
- `toDateInputValue`, `toTimeInputValue` (tidak dipakai di `TransactionsPageContent`)
- `useRef` dari React (hanya dipakai buat `closeSignalRef`)
- `useState` — **jangan dihapus**, masih dipakai di `TransactionItem`?

Cek: `useState` di `TransactionItem` dipakai untuk `[editOpen, setEditOpen]` — ini akan dihapus. Tapi `useState` tidak dipakai di `TransactionsPageContent` langsung. Jadi **hapus** `useState` dari import React.

**Step 3: Ganti body `TransactionItem`**

Untuk case `canEditTransaction` (line 45-184):

**Hapus:**
- `const [editOpen, setEditOpen] = useState(false);` (line 42)
- `const closeSignalRef = useRef<unknown>(null);` (line 43)
- Seluruh `Collapsible` wrapper beserta `CollapsibleContent` form
- `CollapsibleTrigger` button

**Ganti dengan:**
- Card layout yang sama untuk header (icon, title, badges, amount, date)
- Footer: delete button (tetap) + `TransactionEditDialog` component

Hasil akhir `TransactionItem` untuk case `canEditTransaction`:

```tsx
if (canEditTransaction) {
  return (
    <div className="list-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card"
              style={{ borderColor: `${transaction.categoryColor}33`, color: transaction.categoryColor }}
            >
              <CategoryIcon categoryName={transaction.categoryName} kind={transaction.kind} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-medium text-foreground">{transaction.title}</p>
                <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]" tone={transaction.kind === "expense" ? "danger" : "success"}>
                  {transaction.kind === "expense" ? t("transactions.kindExpense") : t("transactions.kindIncome")}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
              {hasStateBadges ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {transaction.isRecurring ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaAutomatic")}</Badge> : null}
                  {transaction.isSavingLinked ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaSavings")}</Badge> : null}
                  {transaction.isBalanceAdjustment ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaAdjustment")}</Badge> : null}
                </div>
              ) : null}
              {transaction.isSavingLinked ? <p className="mt-2 text-xs text-muted-foreground">{t("transactions.savingLinkedNotice")}</p> : null}
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 lg:block lg:text-right">
          <div>
            <p className={`metric text-base lg:text-lg ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
              {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatShortDate(transaction.happenedAt, locale, timezone)} • {formatTimeOfDay(transaction.happenedAt, locale, timezone) || "00:00"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-border" />

      <div className="flex items-center justify-between pt-3">
        <ActionForm action={deleteTransaction}>
          <input type="hidden" name="wallet_id" value={walletId} />
          <input type="hidden" name="transaction_id" value={transaction.id} />
          <ConfirmSubmitButton
            className="min-h-[2.5rem] rounded-lg px-3 font-label text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
            confirmMessage={t("transactions.deleteConfirm")}
            pendingText={t("transactions.deletePending")}
            variant="ghost"
          >
            {t("transactions.deleteButton")}
          </ConfirmSubmitButton>
        </ActionForm>
        <TransactionEditDialog categories={categories} transaction={transaction} walletId={walletId} t={t} />
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add components/features/transactions/transactions-page-content.tsx
git commit -m "feat: replace inline collapsible editor with TransactionEditDialog"
```

---

### Task 3: Update i18n description key

**Objective:** Deskripsi dialog saat ini menyebut "tanpa meninggalkan halaman history" — ini sekarang dipakai juga di halaman transactions, jadi perlu lebih generik.

**Files:**
- **Modify:** `messages/id.json`
- **Modify:** `messages/en.json`

**Step 1: Update `id.json`**

Line 474, ubah:
```json
"editDescription": "Perbarui jenis, kategori, nominal, catatan, atau tanggal tanpa meninggalkan halaman history.",
```
Menjadi:
```json
"editDescription": "Perbarui jenis, kategori, nominal, catatan, atau tanggal transaksi ini.",
```

**Step 2: Update `en.json`**

Line 474, ubah:
```json
"editDescription": "Update the type, category, amount, note, or date without leaving the history page.",
```
Menjadi:
```json
"editDescription": "Update the type, category, amount, note, or date for this transaction.",
```

**Step 3: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "i18n: generalize transaction edit description for dialog reuse"
```

---

### Task 4: Type-check + build verification

**Step 1: Type check**

```bash
cd /home/ilham827/balance-code && npm run typecheck
```
Expected: `0 errors`.

**Step 2: Build**

```bash
npm run build
```
Expected: successful build, no TS/ESLint errors.

**Step 3: Test**

```bash
npm run test
```
Expected: all existing tests pass (tidak ada test baru karena ini pure UI refactor, tidak ada business logic baru).

**Step 4: Commit (kalau ada perubahan dari perbaikan type/build)**

```bash
git add -A
git commit -m "chore: fix type/build issues from edit dialog refactor"
```

---

## Files Changed Summary

| File | Action | Lines |
|------|--------|-------|
| `components/features/transactions/transaction-edit-dialog.tsx` | **Create** | ~90 lines |
| `components/features/transactions/transaction-history-page-content.tsx` | **Modify** | -70 lines (hapus definisi lokal), +1 import |
| `components/features/transactions/transactions-page-content.tsx` | **Modify** | -65 lines (hapus Collapsible), +25 lines (dialog), net -40 |
| `messages/id.json` | **Modify** | 1 line |
| `messages/en.json` | **Modify** | 1 line |

**Total: 5 files, net ~-20 lines** (refactor reduces duplication)

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Dialog tidak terlihat bagus di mobile | Dialog sudah pakai `w-[min(92vw,38rem)]` + `max-h-[90vh] overflow-y-auto` — sudah mobile-first |
| Keyboard behavior di mobile (iOS Safari) | Radix Dialog sudah handle focus trap & scroll lock |
| `updateTransaction` action tidak berubah | Tidak ada perubahan di server action, form field names identik |
| Light/Dark mode | Dialog pakai semantic tokens (`bg-card`, `text-foreground`, dll), aman |

---

## Preserved Functionality

| Fitur | Kenapa tidak berubah |
|-------|---------------------|
| `updateTransaction` server action | Tidak disentuh, form field names sama persis |
| Delete button | Tetap di card footer, tidak berubah |
| Non-editable transactions (saving-linked, read-only) | Guard `canEditTransaction` tetap jalan, mereka tetap render card statis |
| Balance adjustment category notice | Tetap ada di dialog via `transaction.isBalanceAdjustment` conditional |
| Form validation | Tetap di-handle server-side oleh `updateTransaction` action |
| Toast notifikasi | `ActionForm` tetap handle via `useActionToastRefresh` |
| Cache invalidation | `updateTransaction` tetap panggil `revalidateWalletPaths` |
| History page edit behavior | Tidak berubah sama sekali selain import path |
| `formatCurrency`, `formatShortDate`, `formatTimeOfDay` | Tidak berubah, tetap dipakai di card header |
| `AppIcon`, `CategoryIcon`, `Badge` | Tidak berubah |
| Pull-to-refresh | Tidak berubah |

---

## Verification Checklist (Manual QA)

Setelah deploy, verifikasi:

- [ ] **Transactions page (desktop):** klik "Edit" → dialog muncul overlay → isi form → simpan → dialog close, data terupdate, toast muncul
- [ ] **Transactions page (mobile):** dialog full-width, scrollable, form field tidak terpotong
- [ ] **History page (desktop):** edit behavior tidak berubah (masih dialog yang sama)
- [ ] **History page (mobile):** sama, tidak regression
- [ ] **Non-editable transaction (saving-linked):** tidak ada tombol edit, card tetap statis
- [ ] **Read-only user (viewer):** tidak ada tombol edit atau delete
- [ ] **Balance adjustment transaction:** category notice muncul di dialog
- [ ] **Light mode:** dialog overlay + content sesuai tema terang
- [ ] **Dark mode:** dialog overlay + content sesuai tema gelap
- [ ] **Delete button:** masih berfungsi normal di transactions page
