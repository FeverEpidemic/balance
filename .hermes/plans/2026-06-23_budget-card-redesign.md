# Budget Card — Redesign ke Style Transaction Card

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Redesign tampilan budget item di page Budgets agar mirip dengan card transaksi (icon kategori + warna, layout kiri-kanan, progress bar, tombol edit/delete compact).

**Architecture:** Ganti `BudgetItem` component di `budgets-page-content.tsx`. Pakai layout yang sama dengan `TransactionItem` di `transactions-page-content.tsx`. Tidak perlu server/data changes.

**Tech Stack:** React, Tailwind CSS, shadcn Collapsible.

---

## Layout Target

```
┌──────────────────────────────────────────────────────────┐
│  (●)  Makanan & Minuman               Rp 3.000.000      │
│       Rp 2.500.000 / bulan             83%             │
│       ████████████████░░░░  83%                        │
│       Terpakai Rp 2.500.000 dari Rp 3.000.000          │
│       +Rp 500.000 carry-over (kalau ada)               │
│  ─────────────────────────────────────────────────────  │
│       [Hapus]                          [Edit]           │
└──────────────────────────────────────────────────────────┘
```

Elemen per card:
- **Kiri**: CategoryIcon circle (pakai warna dari `budget.categoryId` → cari di `data.categories`)
- **Atas kanan**: Nama kategori (title) + amount budget di kanan
- **Progress bar**: gradient primary, dengan persentase di kanan
- **Detail**: usage label + carry-over label
- **Separator**: border-t tipis
- **Bawah**: tombol hapus (kiri, ghost danger) + tombol edit (kanan, collapsible)

---

## Task 1: Redesign `BudgetItem` component

**Objective:** Ganti tampilan budget item jadi match dengan transaction card style.

**Files:**
- Modify: `components/features/budgets/budgets-page-content.tsx`

**Step 1: Import tambahan**

Di bagian import, tambah `Collapsible`, `CategoryIcon` (dari `@/components/ui/app-icon`):

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible";
// Pastikan CategoryIcon sudah di-import dari app-icon
```

Cek: `AppIcon` udah di-import? Belum. Tambah:

```tsx
import { AppIcon, CategoryIcon } from "@/components/ui/app-icon";
```

Dan tambah `useState`:

```tsx
import { useState } from "react";
```

**Step 2: Bikin helper untuk lookup category color**

Di dalam `BudgetItem`, tambah:

```tsx
  const category = categories.find((c) => c.id === budget.categoryId);
  const categoryColor = category?.color ?? "#595f3d";
```

**Step 3: Redesign JSX**

Ganti seluruh return `BudgetItem` dengan layout baru:

```tsx
function BudgetItem({
  budget,
  categories,
  walletId,
  t
}: {
  budget: BudgetsPageData["budgets"][number];
  categories: BudgetsPageData["categories"];
  walletId: string;
  t: ReturnType<typeof getTranslator>;
}) {
  const category = categories.find((c) => c.id === budget.categoryId);
  const categoryColor = category?.color ?? "#595f3d";
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Collapsible open={editOpen} onOpenChange={setEditOpen} className="list-card">
      {/* Top: icon + info + amount */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {/* Category color circle */}
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card"
              style={{ borderColor: `${categoryColor}33`, color: categoryColor }}
            >
              <CategoryIcon categoryName={budget.categoryName} kind="expense" className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              {/* Title */}
              <p className="truncate text-sm font-medium text-foreground">
                {budget.categoryName}
              </p>

              {/* Budget amount per month */}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(budget.amount)} / {t("budgets.perMonth")}
              </p>

              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-soft-strong))]"
                    style={{ width: `${Math.min(budget.ratio, 100)}%` }}
                  />
                </div>
                <span className="shrink-0 font-label text-[11px] text-muted-foreground">
                  {budget.ratio}%
                </span>
              </div>

              {/* Usage label */}
              <p className="mt-2 text-xs text-muted-foreground">
                {budget.usageLabel}
              </p>

              {/* Carry-over label */}
              {budget.carryOverAmount > 0 ? (
                <p className="mt-1 text-xs text-primary/70">
                  +{formatCurrency(budget.carryOverAmount)} {t("budgets.carryOverLabel")}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right side: total amount (desktop only, hidden on mobile since it's inline above) */}
        <div className="hidden lg:block lg:text-right">
          <p className="metric text-base text-foreground">
            {formatCurrency(budget.totalBudget)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("budgets.totalBudgetLabel")}
          </p>
        </div>
      </div>

      {/* Separator + actions */}
      <div className="mt-3 border-t border-border" />

      <div className="flex items-center justify-between pt-3">
        {/* Delete button */}
        <ActionForm action={deleteBudget} className="w-full sm:w-auto">
          <input type="hidden" name="wallet_id" value={walletId} />
          <input type="hidden" name="budget_id" value={budget.id} />
          <ConfirmSubmitButton
            className="min-h-[2.5rem] rounded-lg px-3 font-label text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
            confirmMessage={t("budgets.deleteConfirm")}
            pendingText={t("budgets.deletePending")}
            variant="ghost"
          >
            {t("budgets.deleteButton")}
          </ConfirmSubmitButton>
        </ActionForm>

        {/* Edit toggle */}
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="soft"
            className="rounded-xl px-4 py-2 font-label text-sm font-medium"
          >
            {editOpen ? t("common.closeEditor") : t("budgets.editButton")}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* Edit form — collapsible */}
      <CollapsibleContent>
        <ActionForm action={updateBudget} className="mt-3 border-t border-border pt-4">
          {({ state }) => (
            <>
              <input type="hidden" name="wallet_id" value={walletId} />
              <input type="hidden" name="budget_id" value={budget.id} />
              <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,140px)_minmax(0,140px)_auto]">
                <label className="block">
                  <span className="mb-2 block font-label text-xs text-muted-foreground">{t("budgets.categoryLabel")}</span>
                  <select name="category_id" defaultValue={budget.categoryId} required>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-xs text-muted-foreground">{t("budgets.monthLabel")}</span>
                  <input name="month_start" type="month" defaultValue={budget.monthStart.slice(0, 7)} required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-xs text-muted-foreground">{t("budgets.limitLabel")}</span>
                  <CurrencyInput name="amount" defaultValue={budget.amount} required />
                </label>
                <div className="flex min-w-0 items-end gap-2">
                  <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                    <input name="carry_over_enabled" type="checkbox" value="true" defaultChecked={budget.carryOverEnabled} className="h-3.5 w-3.5 rounded border-muted-foreground" />
                    <span className="text-muted-foreground">{t("budgets.carryOverLabel")}</span>
                  </label>
                  <SubmitButton className="w-full md:w-auto" pendingText={t("budgets.updatePending")} variant="soft">
                    {t("budgets.updateButton")}
                  </SubmitButton>
                </div>
              </div>
            </>
          )}
        </ActionForm>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

**Step 4: Hapus `InlineEditPanel` — tidak lagi dipakai**

Setelah redesign di atas, import `InlineEditPanel` bisa dihapus (tidak digunakan lagi di BudgetItem).

**Step 5: Commit**

```bash
git add components/features/budgets/budgets-page-content.tsx
git commit -m "feat: redesign budget card to match transaction card style"
```

---

## Task 2: Tambah i18n key `budgets.perMonth`

**Objective:** Label "/ bulan" untuk display amount.

**Files:**
- Modify: `messages/id.json`
- Modify: `messages/en.json`

**Step 1: Tambah key**

`messages/id.json`:
```json
"perMonth": "/ bulan",
```

`messages/en.json`:
```json
"perMonth": "/ month",
```

**Step 2: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "feat: add budgets.perMonth i18n key"
```

---

## Task 3: Typecheck, test, build

**Objective:** Verifikasi.

**Step 1: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

**Step 2: Build**

```bash
npm run build
```
Expected: build success.

**Step 3: Manual visual check**

- [ ] Budget card dengan progress 50% → bar setengah, warna primary
- [ ] Budget card 100% → bar penuh
- [ ] Budget card dengan carry-over → label carry-over muncul
- [ ] Category icon circle → warna sesuai warna kategori
- [ ] Klik Edit → form expand, tombol jadi "Tutup editor"
- [ ] Edit form → category, month, amount, carry-over checkbox tetap berfungsi
- [ ] Klik Hapus → confirm dialog muncul
- [ ] Dark mode → semua tetap readable
- [ ] Mobile → layout stack vertical, tetap oke
- [ ] Belum ada budget → empty state tetap muncul (tidak berubah)

---

## Summary

| File | Change | Line delta |
|------|--------|------------|
| `components/features/budgets/budgets-page-content.tsx` | Redesign BudgetItem: +Collapsible, +CategoryIcon, layout baru, hapus InlineEditPanel | ~+60 / -30 |
| `messages/id.json` | +1 key `budgets.perMonth` | +1 |
| `messages/en.json` | +1 key `budgets.perMonth` | +1 |

**Total: ~32 lines net change across 3 files. 3 tasks.**

### Yang TIDAK berubah:
- Create budget form (kiri) tidak berubah
- Month filter tidak berubah
- Empty state tidak berubah
- Header total budget (Task 2 dari plan sebelumnya) tetap ada
- Server actions (create, update, delete) tidak berubah
