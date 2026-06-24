# Fix: Delete & Edit Transaksi Butuh Dua Kali Action

> **Status:** ✅ Implemented (2026-06-23). Plan ini mendokumentasikan root cause, fix, dan verification.

**Goal:** Delete dan edit transaksi bekerja di action pertama — tidak perlu dua kali klik.

**Tech Stack:** Next.js 16.2.9 · React 19.2.7 · Radix UI (Collapsible, Select, Dialog, AlertDialog) · `useActionState` · `useFormStatus`

---

## Root Cause Analysis

Dua bug terpisah dengan root cause berbeda:

### Bug A: Delete halaman utama — silent fail via `onClick` bypass

```
┌──────────────────────────────────────────────────────────┐
│  SEBELUM (broken)                                        │
│                                                          │
│  ConfirmSubmitButton                                     │
│  ┌─ onClick={() => onDelete(id)} ────────────────────┐  │
│  │  → handleDelete()                                  │  │
│  │    → useOptimistic (optimistic remove)             │  │
│  │    → deleteTransaction({status:"idle"}, formData)  │  │
│  │      .then(...)  ← NO .catch()                     │  │
│  │                                                    │  │
│  │  ⚠️ useFormStatus() mencari parent <form>          │  │
│  │    → TIDAK ADA (ConfirmSubmitButton standalone)    │  │
│  │  ⚠️ formElement?.requestSubmit()                   │  │
│  │    → TIDAK TERPANGGIL (onClick override)           │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Hasil: first call silent fail, second call works        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  SESUDAH (fixed)                                         │
│                                                          │
│  <ActionForm action={deleteTransaction}>                 │
│    <input name="wallet_id" ... />                        │
│    <input name="transaction_id" ... />                   │
│    <ConfirmSubmitButton   ← NO onClick                   │
│      ...                                                 │
│    />                                                    │
│  </ActionForm>                                           │
│                                                          │
│  ✅ <form> wrapper → useFormStatus() valid context       │
│  ✅ NO onClick → requestSubmit() triggered               │
│  ✅ useActionState → proper async state machine          │
│  ✅ ActionForm handles toast + revalidation              │
└──────────────────────────────────────────────────────────┘
```

**Root cause detail:** `ConfirmSubmitButton` (line 80-84) punya dua jalur:
```ts
// Line 80-84 — confirm-submit-button.tsx
if (onClick) {
  onClick();                          // ← JALUR INI (ketika onClick ada)
} else {
  formElement?.requestSubmit();       // ← JALUR BENAR (form submit normal)
}
```

Ketika `onClick` diisi, `requestSubmit()` TIDAK PERNAH dipanggil. `useFormStatus()` di `ConfirmSubmitButton` (line 43) bergantung pada parent `<form>` yang sedang submit — tapi karena gak ada form submit, `pending` selalu `false`, dan `useActionState` gak ter-update.

`handleDelete` (sebelumnya di `TransactionsPageContent`) memanggil `deleteTransaction()` sebagai **raw function call** — bukan via `formAction` — sehingga error handler (`useActionToastRefresh`) gak jalan. `.then()` tanpa `.catch()` bikin error server action swallowed silently.

### Bug B: Edit form — `useActionState` stale state setelah collapsible dibuka-tutup

```
┌──────────────────────────────────────────────────────────┐
│  SEBELUM (broken)                                        │
│                                                          │
│  Collapsible open=false                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  <ActionForm>  ← useActionState = {status:"idle"}│   │
│  │    user edits, submits                            │   │
│  │    → state = {status:"success"}                   │   │
│  │    → closeSignalRef triggers setEditOpen(false)   │   │
│  └──────────────────────────────────────────────────┘   │
│  Collapsible closed (component NOT unmounted — hidden)   │
│                                                          │
│  Collapsible open=true AGAIN                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  <ActionForm>  ← useActionState MASIH            │   │
│  │                   {status:"success"} !!          │   │
│  │    user edits, submits                            │   │
│  │    ⚠️ state tidak berubah karena initialState     │   │
│  │      sudah bukan "idle"                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Hasil: first submit setelah reopen = "no-op"            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  SESUDAH (fixed)                                         │
│                                                          │
│  <CollapsibleContent>                                    │
│    <ActionForm                                           │
│      key={`edit-${transaction.id}-${editOpen}`}  ← KEY  │
│      ...                                                 │
│    >                                                     │
│  </CollapsibleContent>                                   │
│                                                          │
│  ketika editOpen = false → true:                         │
│    → React unmounts old <ActionForm>                     │
│    → React mounts NEW <ActionForm>                       │
│    → useActionState(action, {status:"idle"}) FRESH       │
│                                                          │
│  ✅ setiap collapsible dibuka = form baru                │
│  ✅ closeSignalRef ikut reset (useRef di-remount)        │
└──────────────────────────────────────────────────────────┘
```

**Root cause detail:** React 19 `useActionState` (line 92 di `ActionForm`) mempertahankan state across re-renders selama component tidak unmount. Radix `Collapsible` menggunakan `display: none` / `hidden` attribute — component **tidak di-unmount**. State `useActionState` yang sudah `{status: "success"}` dari submit sebelumnya tetap ada. Ketika collapsible dibuka lagi dan user submit, `useActionState` tidak mereset ke `initialState`, sehingga React 19 menganggap state tidak berubah dan tidak memproses ulang.

**Fix:** `key` prop memaksa React unmount dan mount ulang component ketika `key` berubah. `key={`edit-${transaction.id}-${editOpen}`}` — `editOpen` adalah boolean yang berubah dari `false` ke `true` setiap kali collapsible dibuka.

---

## Implementasi

### Task 1: Delete halaman utama — ganti onClick → ActionForm

**File:** `components/features/transactions/transactions-page-content.tsx`

**Step 1.1: Hapus optimistic delete logic dari `TransactionsPageContent`**

Hapus semua yang berkaitan dengan delete manual:

```diff
- import { useOptimistic, useCallback, startTransition, useRef, useState, useEffect } from "react";
+ import { useRef, useState } from "react";
- import { useRouter } from "next/navigation";
- import { toast } from "sonner";
- import { useToast } from "@/components/ui/toast-provider";

  // Hapus dari TransactionsPageContent body (sebelumnya lines 245-311):
- const [optimisticTransactions, removeOptimisticTransaction] = useOptimistic(...);
- const deletedTransactionRef = useRef(...);
- const handleDelete = useCallback(...);
```

**Step 1.2: Hapus `onDelete` prop dari `TransactionItem`**

```diff
  type TransactionItemProps = {
    canMutate: boolean;
    categories: TransactionsPageData["categories"];
    transaction: TransactionsPageData["transactions"][number];
    walletId: string;
    t: ReturnType<typeof getTranslator>;
-   onDelete: (transactionId: string) => void;
  };
```

Dan hapus `onDelete` dari destructuring di function signature (line 36) dan dari pemanggilan di line 367.

**Step 1.3: Wrap delete button dalam `ActionForm`**

Ganti di dalam `TransactionItem`, di `if (canEditTransaction)` branch (line 89-101 sekarang / line 93-102 sebelum):

```tsx
// SEBELUM:
<div className="flex items-center justify-between pt-3">
  <ConfirmSubmitButton
    ...
    onClick={() => onDelete(transaction.id)}  // ← ini root cause
  >
    {t("transactions.deleteButton")}
  </ConfirmSubmitButton>
  ...
</div>

// SESUDAH:
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
  <CollapsibleTrigger asChild>
    <Button type="button" variant="soft" className="rounded-xl px-4 py-2 font-label text-sm font-medium">
      {editOpen ? t("common.closeEditor") : t("transactions.editButton")}
    </Button>
  </CollapsibleTrigger>
</div>
```

> **Kenapa gak perlu guard `canEditTransaction && !transaction.isSavingLinked`:** Kode ini berada di dalem `if (canEditTransaction)` branch (line 45/49). `canEditTransaction` sendiri sudah didefinisikan sebagai `canMutate && !transaction.isSavingLinked` (line 39/43). Extra guard redundant.

**Step 1.4: Ganti `optimisticTransactions` → `data.transactions`**

```diff
- {optimisticTransactions.map((transaction) => (
+ {data.transactions.map((transaction) => (
```

Dan hapus `onDelete={handleDelete}` dari JSX.

**Step 1.5: Hapus undo toast**

Karena `handleDelete` dihapus, undo toast (sonner `toast.success` dengan action "Batalkan" dan `setTimeout` refresh 5.5 detik) ikut hilang. `ConfirmSubmitButton` confirmation dialog sudah cukup sebagai safety net.

**Commit:**
```bash
git add components/features/transactions/transactions-page-content.tsx
git commit -m "fix: replace onClick-based delete with ActionForm (single-action fix)"
```

### Task 2: Edit halaman utama — key-based remount untuk `useActionState`

**File:** `components/features/transactions/transactions-page-content.tsx`

**Step 2.1: Tambah `key` di `ActionForm` edit**

```tsx
// Line 114-115 — tambah key prop:
<CollapsibleContent>
  <ActionForm
    key={`edit-${transaction.id}-${editOpen}`}  // ← TAMBAH INI
    action={updateTransaction}
    onSuccess={() => undefined}
    className="mt-3"
  >
```

> **Kenapa `edit-${transaction.id}-${editOpen}`:** `${editOpen}` adalah boolean yang berubah dari `false` ke `true` tiap collapsible dibuka → React unmount `ActionForm` lama + mount baru → `useActionState` restart dari `initialState = { status: "idle" }`.

**Step 2.2: Verifikasi `closeSignalRef` masih jalan**

`closeSignalRef` (line 43, 122-126 di kode saat ini) menggunakan `useRef(null)`. Ketika component di-remount via `key` change, ref baru dibuat (`null`), jadi pattern auto-close di submit pertama tetap berfungsi. Tidak perlu perubahan.

**Commit:**
```bash
git add components/features/transactions/transactions-page-content.tsx
git commit -m "fix: add key prop to edit ActionForm for fresh useActionState on reopen"
```

### Task 3: Edit dialog halaman history — key-based remount

**File:** `components/features/transactions/transaction-history-page-content.tsx`

**Step 3.1: Tambah `key` di `ActionForm` dalam `TransactionEditDialog`**

```tsx
// Line 86 — tambah key prop:
<ActionForm
  key={`edit-tx-${transaction.id}-${open}`}  // ← TAMBAH INI
  action={updateTransaction}
  className="mt-5 grid min-w-0 gap-4"
  onSuccess={() => setOpen(false)}
>
```

> **Kenapa ini defensive:** Radix `Dialog` conditional rendering sudah unmount `ActionForm` ketika `open=false`. Tapi `key` eksplisit menjamin fresh mount bahkan dalam edge case (dialog re-render tanpa unmount, React batching, dll).

**Commit:**
```bash
git add components/features/transactions/transaction-history-page-content.tsx
git commit -m "fix: add key prop to history edit dialog ActionForm"
```

### Task 4: Delete halaman history — tambah key defensive + verifikasi

**File:** `components/features/transactions/transaction-history-page-content.tsx`

**Step 4.1: Tambah `key` di delete `ActionForm`**

```tsx
// Line 157 — tambah key prop:
<ActionForm
  key={`delete-tx-${transaction.id}`}  // ← TAMBAH INI
  action={deleteTransaction}
  className="w-full sm:w-auto"
>
```

> Delete di history page udah pake `ActionForm` pattern yang bener (gak ada `onClick` bypass). Tapi `key` ditambahin sebagai defensive measure — memastikan setiap `ActionForm` instance terisolasi per transaksi.

**Commit:**
```bash
git add components/features/transactions/transaction-history-page-content.tsx
git commit -m "fix: add defensive key to history delete ActionForm"
```

---

## Verification

### Manual Test Checklist

```
□ Task 1 — Delete halaman utama
  □ Buka /wallets/{id}/transactions
  □ Klik "Hapus" pada transaksi → confirm dialog muncul
  □ Klik "Lanjutkan" → transaksi langsung hilang (1 action)
  □ Tidak ada error toast
  □ Coba delete transaksi lain — konsisten

□ Task 2 — Edit halaman utama
  □ Klik "Edit" pada transaksi → form muncul
  □ Ganti kategori → klik "Simpan" → 1 action langsung berubah
  □ Klik "Edit" lagi → form fresh dengan default values
  □ Ganti nilai lain → simpan → 1 action

□ Task 3 — Edit halaman history
  □ Buka /wallets/{id}/transactions?view=history
  □ Klik "Edit" → dialog muncul
  □ Ganti kategori → "Simpan Perubahan" → 1 action
  □ Buka edit transaksi lain → dialog fresh

□ Task 4 — Delete halaman history
  □ Di halaman history → klik "Hapus" → confirm dialog
  □ "Lanjutkan" → transaksi hilang (1 action)
  □ Konsisten di transaksi lain
```

### Automated Checks

```bash
npm run typecheck   # must pass — 0 errors
npm run lint        # must pass
npm run test        # must pass — 326 tests
```

---

## Dampak

### File yang Berubah

| File | Perubahan | Lines Delta |
|------|-----------|-------------|
| `components/features/transactions/transactions-page-content.tsx` | Task 1 + Task 2 | -71 lines (hapus optimistic logic) |
| `components/features/transactions/transaction-history-page-content.tsx` | Task 3 + Task 4 | +2 key props |

### Yang TIDAK Berubah

| Scope | Keterangan |
|-------|------------|
| `app/actions/transactions.ts` | Server action logic udah bener — `deleteTransaction` dan `updateTransaction` gak disentuh |
| `components/ui/action-form.tsx` | `ActionForm` — `useActionState` + `useActionToastRefresh` pattern udah solid |
| `components/ui/confirm-submit-button.tsx` | `ConfirmSubmitButton` — dual-path `onClick` / `requestSubmit()` adalah by-design |
| `components/ui/category-select.tsx` | `CategorySelect` — Radix Select controlled component, gak ada issue |
| `components/ui/submit-button.tsx` | `SubmitButton` — gak disentuh |
| Routing, auth, RLS, cache invalidation | Semua gak berubah |

### Tradeoffs

| Aspek | Sebelum | Sesudah | Justifikasi |
|-------|---------|---------|-------------|
| Delete UX latency | Optimistic (instant ilang) | ~500ms (nunggu refresh) | Acceptable — confirm dialog kasih feedback langsung |
| Undo toast | Ada (5 detik undo) | Tidak ada | Acceptable — confirm dialog = safety net |
| Edit form state | Stale (useActionState gak reset) | Fresh setiap kali dibuka | Ini fix, bukan tradeoff |

---

## Ringkasan

| # | Task | File | Perubahan |
|---|------|------|-----------|
| 1 | Delete → ActionForm | `transactions-page-content.tsx` | Hapus optimistic logic, wrap delete di ActionForm, hapus onDelete prop |
| 2 | Edit → key remount | `transactions-page-content.tsx` | Tambah `key={`edit-${transaction.id}-${editOpen}`}` |
| 3 | Edit dialog → key remount | `transaction-history-page-content.tsx` | Tambah `key={`edit-tx-${transaction.id}-${open}`}` |
| 4 | Delete history → key defensive | `transaction-history-page-content.tsx` | Tambah `key={`delete-tx-${transaction.id}`}` |
