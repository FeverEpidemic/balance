# TransactionItem UI Restyle — Implementation Plan

> **For Hermes:** Execute task-by-task with `subagent-driven-development`. Commit after each task.

**Goal:** Ganti InlineEditPanel (glass-panel + title + description) dengan action row horizontal (delete | edit) + bare CollapsibleContent untuk form edit. Layout lebih bersih, selalu terlihat bisa di-edit tanpa edukasi teks.

**Architecture:** Collapsible jadi root wrapper seluruh card, CollapsibleTrigger jadi tombol "Ubah transaksi" di action row, CollapsibleContent render form tanpa wrapper glass-panel. closeSignal pattern di-inline dari InlineEditPanel.

**Design ref:** `DESIGN.md` — Serene Capital tokens. Gunakan `var(--primary-strong)` / `var(--muted-foreground)` / `var(--danger)` bukan hardcoded hex.

---

## Context & Current State

**File utama yang disentuh:** `components/features/transactions/transactions-page-content.tsx`

**Komponen yang dihapus:** `InlineEditPanel` (import + usage) — tidak dipakai di file lain manapun setelah ini.

**Komponen baru dipakai:** `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` dari `@/components/ui/shadcn/collapsible` (Radix UI wrapper, sudah ada).

**State yang perlu ditambah:** `useState` untuk `editOpen`, `useRef` untuk `closeSignalRef`.

### Current layout (lines 48-168):
```
┌─ list-card ─────────────────────────────────────┐
│  [icon] Title          [income]   -Rp50.000     │
│         Kategori / Label    12 Jun • 14:30      │
│  ┌─ InlineEditPanel (glass-panel + border-t) ──┐│
│  │ ● TRANSAKSI INI BISA DIEDIT                 ││
│  │   Owner dan editor bisa membuka panel...    ││
│  │                         [Ubah transaksi]     ││
│  │  ┌─ CollapsibleContent ──────────────────┐  ││
│  │  │  [form fields + Update button]        │  ││
│  │  └───────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────┘│
│  [Hapus transaksi — full-width ghost button]    │
└─────────────────────────────────────────────────┘
```

### Target layout:
```
┌─ Collapsible (root) ────────────────────────────┐
│  [icon] Title          [income]   -Rp50.000     │
│         Kategori / Label    12 Jun • 14:30      │
│  ───────────────────────────────────────────────│
│  [Hapus transaksi]           [Ubah transaksi]   │
│  ┌─ CollapsibleContent ─────────────────────┐   │
│  │  [form fields + Update button]           │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Task 1: Tambah imports dan state ke TransactionItem

**Files:**
- Modify: `components/features/transactions/transactions-page-content.tsx`

**Step 1: Tambah import shadcn collapsible**

Di line 11 (setelah import ActionForm), tambah:
```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible";
```

**Step 2: Tambah import useState + useRef**

Line 24, ubah dari:
```typescript
import { useOptimistic, useCallback, startTransition, useRef } from "react";
```
Jadi:
```typescript
import { useOptimistic, useCallback, startTransition, useRef, useState, useEffect } from "react";
```

**Step 3: Tambah state di dalam TransactionItem function**

Setelah line 46 (`const hasStateBadges = ...`), tambah:
```typescript
const [editOpen, setEditOpen] = useState(false);
const closeSignalRef = useRef<unknown>(null);
```

**Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: PASS — hanya tambah import + state, belum ada usage.

**Step 5: Commit**

```bash
git add components/features/transactions/transactions-page-content.tsx
git commit -m "feat: add Collapsible imports and editOpen state to TransactionItem"
```

---

## Task 2: Wrap card dengan Collapsible root + hapus mobile edit badge

**Files:**
- Modify: `components/features/transactions/transactions-page-content.tsx` lines 48-93, 95-168

**Step 1: Hapus mobile edit badge (lines 86-91)**

Hapus blok ini:
```typescript
{canEditTransaction ? (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-strong lg:hidden">
    <AppIcon name="edit" className="h-3.5 w-3.5" tone="primary" />
    <span>{t("transactions.editButton")}</span>
  </span>
) : null}
```

**Step 2: Ganti `<div className="list-card">` jadi conditional Collapsible wrapper**

Line 48-49 saat ini:
```typescript
return (
  <div className="list-card">
```

Untuk `canEditTransaction === true`, ganti jadi:
```typescript
return (
  <Collapsible open={editOpen} onOpenChange={setEditOpen} className="list-card">
```

Untuk `canEditTransaction === false`, tetap pakai `<div className="list-card">`.

Full conditional:
```typescript
if (canEditTransaction) {
  return (
    <Collapsible open={editOpen} onOpenChange={setEditOpen} className="list-card">
      {/* ... transaction info (lines 50-85, minus 86-91) ... */}
      {/* ... action row + CollapsibleContent (will be added in Task 3-4) ... */}
    </Collapsible>
  );
}

return (
  <div className="list-card">
    {/* ... transaction info (lines 50-85, minus 86-91) ... */}
  </div>
);
```

> **PENTING:** Jangan di-commit dulu — ini incomplete. Commit setelah Task 4.

---

## Task 3: Tambah action row (divider + delete + edit trigger)

**Files:**
- Modify: `components/features/transactions/transactions-page-content.tsx`

**Step 1: Tambah divider + action row SETELAH transaction info section**

Setelah penutup `</div>` dari flex container utama (line 93), dan sebelum `{canEditTransaction ? (` block lama (line 95), tambah:

```typescript
<div className="mt-3 border-t border-border" />

<div className="flex items-center justify-between pt-3">
  <ConfirmSubmitButton
    className="min-h-[2.5rem] rounded-lg px-3 font-label text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
    confirmMessage={t("transactions.deleteConfirm")}
    pendingText={t("transactions.deletePending")}
    variant="ghost"
    onClick={() => onDelete(transaction.id)}
  >
    {t("transactions.deleteButton")}
  </ConfirmSubmitButton>
  <CollapsibleTrigger asChild>
    <Button
      type="button"
      variant="soft"
      className="rounded-xl px-4 py-2 font-label text-sm font-medium"
    >
      {editOpen ? t("common.closeEditor") : t("transactions.editButton")}
    </Button>
  </CollapsibleTrigger>
</div>
```

**Step 2: Hapus block InlineEditPanel lama (lines 95-155) dan delete button lama (lines 157-167)**

Hapus SEMUA dari `{canEditTransaction ? (` line 95 sampai akhir return block lama (line 168 `</div>` penutup list-card).

**Step 3: Typecheck — expected FAIL karena blok belum lengkap**

```bash
npm run typecheck
```

Expected: FAIL — `AppIcon` import mungkin unused, `InlineEditPanel` import unused, JSX belum tutup rapi. Ini normal — di-fix di Task 4.

---

## Task 4: Tambah CollapsibleContent dengan form edit (closeSignal pattern)

**Files:**
- Modify: `components/features/transactions/transactions-page-content.tsx`

**Step 1: Tambah CollapsibleContent block setelah action row**

Setelah `</div>` penutup action row (dari Task 3), tambah:

```typescript
<CollapsibleContent>
  <ActionForm
    action={updateTransaction}
    onSuccess={() => undefined}
    className="mt-3"
  >
    {({ state }) => {
      // Auto-close on successful save (closeSignal pattern dari InlineEditPanel)
      if (closeSignalRef.current !== state && state.status === "success") {
        closeSignalRef.current = state;
        // Use setTimeout to avoid state update during render
        setTimeout(() => setEditOpen(false), 0);
      }

      return (
        <div className="border-t border-border pt-4">
          <input type="hidden" name="wallet_id" value={walletId} />
          <input type="hidden" name="transaction_id" value={transaction.id} />
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.kindLabel")}</span>
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
                <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.categoryLabel")}</span>
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
              <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.amountLabel")}</span>
              <CurrencyInput name="amount" defaultValue={transaction.amount} required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.noteLabel")}</span>
              <input name="note" defaultValue={transaction.note ?? ""} placeholder={t("transactions.notePlaceholder")} />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.dateLabel")}</span>
              <input name="happened_at" type="date" defaultValue={toDateInputValue(transaction.happenedAt)} required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.timeLabel")}</span>
              <input name="happened_at_time" type="time" defaultValue={toTimeInputValue(transaction.happenedAt, timezone)} />
            </label>
            <div className="flex min-w-0 flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap">
              <SubmitButton className="w-full sm:w-auto" pendingText={t("transactions.savePending")} variant="soft">
                {t("transactions.updateButton")}
              </SubmitButton>
            </div>
          </div>
        </div>
      );
    }}
  </ActionForm>
</CollapsibleContent>
```

**Step 2: Bersihin import yang gak dipakai**

Hapus import ini:
```typescript
import { InlineEditPanel } from "@/components/ui/inline-edit-panel";  // line 18
```

Cek apakah `AppIcon` masih dipakai — kalau cuma dipakai di mobile badge (yang udah dihapus), hapus juga:
```typescript
// Line 9, hapus AppIcon dari destructure:
import { CategoryIcon } from "@/components/ui/app-icon";
```

**Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: PASS — semua import bersih, JSX valid, state management benar.

**Step 4: Commit**

```bash
git add components/features/transactions/transactions-page-content.tsx
git commit -m "refactor: replace InlineEditPanel with Collapsible action row in TransactionItem"
```

---

## Task 5: Bersihin i18n keys yang gak dipakai

**Files:**
- Modify: `messages/id.json`
- Modify: `messages/en.json`

**Step 1: Cek apakah key masih direfer di tempat lain**

```bash
grep -r "editCardTitle\|editCardDescription" --include="*.ts" --include="*.tsx" --include="*.json" /home/ilham827/balance-code/
```

Expected: hanya muncul di `messages/id.json` dan `messages/en.json`.

**Step 2: Hapus dari id.json**

Hapus 2 lines ini (sekitar line 543-544):
```json
"editCardTitle": "Transaksi ini bisa diedit",
"editCardDescription": "Owner dan editor bisa membuka panel ini saat perlu mengubah kategori, nominal, catatan, atau tanggal.",
```

**Step 3: Hapus dari en.json**

Hapus 2 lines ini:
```json
"editCardTitle": "This transaction can be edited",
"editCardDescription": "Owners and editors can open this panel when they need to change the category, amount, note, or date.",
```

**Step 4: Verifikasi — typecheck + grep ulang**

```bash
npm run typecheck
grep -r "editCardTitle\|editCardDescription" --include="*.ts" --include="*.tsx" --include="*.json" /home/ilham827/balance-code/
```

Expected: typecheck PASS, grep returns empty.

**Step 5: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "chore: remove unused editCardTitle/editCardDescription i18n keys"
```

---

## Task 6: Build + full verification

**Step 1: Build production**

```bash
npm run build
```

Expected: No errors, semua halaman ke-generate.

**Step 2: Jalankan semua test**

```bash
npm run test
```

Expected: All pass.

**Step 3: Visual checklist (manual verify di dev server)**

```bash
npm run dev
```

Buka halaman transaksi, verifikasi:
- [ ] Card transaksi tanpa edit: tampil normal tanpa action row
- [ ] Card transaksi dengan edit: tampil action row (delete kiri, edit kanan)
- [ ] Klik "Ubah transaksi" → form muncul di bawah action row (bukan glass-panel)
- [ ] Mobile: action row tetap horizontal, tidak overflow
- [ ] Dark mode: divider, text, hover states kontras
- [ ] Klik save → form auto-close, data terupdate
- [ ] Klik "Hapus transaksi" → confirm dialog → undo toast muncul
- [ ] Transaction dengan `isSavingLinked`: gak muncul action row (canEditTransaction=false)
- [ ] Balance adjustment transaction: kategori diganti panel informasi readonly

**Step 4: Commit final**

```bash
git add -A
git commit -m "chore: final verification TransactionItem restyle"
```

---

## Ringkasan Perubahan per File

| File | Perubahan | +/- Lines |
|------|-----------|-----------|
| `components/features/transactions/transactions-page-content.tsx` | Replace InlineEditPanel → Collapsible action row | ~ -40 +70 |
| `messages/id.json` | Hapus 2 key | -2 |
| `messages/en.json` | Hapus 2 key | -2 |

**Total: 3 file, ~130 line changes**

## Preserved Functionality

- ✅ Semua form fields (kind, category, amount, note, date, time) — identik
- ✅ `onDelete` callback + undo toast — identik (cuma restyle tombol)
- ✅ `canEditTransaction` permission check — diterapkan ke seluruh action row
- ✅ `isBalanceAdjustment` guard — kategori diganti panel readonly (tetap)
- ✅ Auto-close collapsible setelah save sukses — via closeSignalRef pattern
- ✅ Non-editable transaction (`isSavingLinked`): card polos tanpa action row

## Risks

| Risk | Mitigasi |
|------|----------|
| `AppIcon` import jadi unused | Task 4 step 2 — dicek dan dihapus kalau perlu |
| Collapsible root bikin semua card jadi interactive element | Hanya diterapkan saat `canEditTransaction=true`, else tetap `<div>` |
| closeSignal pakai `setTimeout(0)` — race condition? | Pattern ini udah proven di InlineEditPanel. `setTimeout` prevents setState-during-render warning |
| i18n key removal bisa bikin runtime error kalau masih direfer | Task 5 step 1 — grep dulu sebelum hapus |
