# Hapus Duplicate Category Breakdown Bar Chart dari Dashboard — Plan

> **For Hermes:** Execute task-by-task. Commit per task.

**Goal:** Dashboard saat ini punya dua card "Category Mix / Largest spending categories this month" — satu donut chart (DashboardCategoryBreakdown), satu bar chart horizontal. Hapus yang bar chart, keep yang donut chart.

**Architecture:** Cukup hapus 1 div card dari `dashboard-content.tsx`. Gak ada dependency ke file lain. Data `dashboard.categorySpend` masih dipakai pie chart.

---

## Source

**File:** `components/features/dashboard/dashboard-content.tsx`

**Blok yang dihapus:** Lines 205-236 — div `2xl:col-span-5` berisi bar chart.

**Blok parent:** Lines 101-237 — `<section className="grid gap-4 2xl:grid-cols-12">` dengan 2 child:
- `2xl:col-span-7` — wallet cards
- `2xl:col-span-5` — bar chart (dihapus)

---

## Task 1: Hapus card bar chart

**Files:**
- Modify: `components/features/dashboard/dashboard-content.tsx`

**Step 1: Hapus div card ke-2 dari grid section**

Hapus blok lines 205-236:
```tsx
<div className="card 2xl:col-span-5">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="eyebrow">{t("dashboard.categoryEyebrow")}</p>
      <h3 className="headline-md mt-2">{t("dashboard.categoryTitle")}</h3>
    </div>
    {dashboard.categorySpend.length > 0 ? <BadgeLike>{dashboard.categorySpend.length}</BadgeLike> : null}
  </div>
  <div className="mt-6 stack-list">
    {dashboard.categorySpend.length === 0 ? (
      <EmptyState title={t("dashboard.emptyCategoryTitle")} description={t("dashboard.emptyCategoryDescription")} />
    ) : null}
    {dashboard.categorySpend.map((item) => (
      <div key={item.name} className="list-card">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card" style={{ borderColor: `${item.color}33`, color: item.color }}>
            <CategoryIcon categoryName={item.name} kind="expense" className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{item.name}</span>
              <span className="metric">{formatCurrency(item.value)}</span>
            </div>
            <div className="h-3 rounded-full bg-muted">
              <div className="h-3 rounded-full" style={{ width: `${Math.max((item.value / dashboard.categorySpend[0].value) * 100, 18)}%`, backgroundColor: item.color }} />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

**Step 2: Simplifikasi grid parent**

Karena sekarang cuma ada 1 child di grid, section parent (lines 101-237) bisa disimplifikasi. Ganti dari:

```tsx
<section className="grid gap-4 2xl:grid-cols-12">
  <div className="card 2xl:col-span-7">
    ...
  </div>
</section>
```

Jadi langsung tanpa grid wrapper (karena single child gak butuh grid):
```tsx
<div className="card">
  ...
</div>
```

> **Note:** Kalau mau keep grid buat future use, bisa juga hapus `2xl:grid-cols-12` dari parent tapi keep section wrapper. Simpler: langsung ganti `<section className="grid...">` jadi `<section>` dan `<div className="card 2xl:col-span-7">` jadi `<div className="card">`.

**Step 3: Cek — apakah `BadgeLike` masih dipakai?**

`BadgeLike` function (lines 316-318) cuma dipakai di bar chart (line 211). Setelah hapus bar chart, `BadgeLike` jadi unused. Hapus fungsinya:

```typescript
function BadgeLike({ children }: { children: number }) {
  return <span className="theme-primary-pill inline-flex rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]">{children}</span>;
}
```

**Step 4: Cek import `EmptyState`**

`EmptyState` masih dipakai di line 92 (daily expense empty state) dan line 112 (empty wallet). Jadi KEEP import.

**Step 5: Cek `CategoryIcon`**

Masih dipakai di TransactionItem recent list (line 260). KEEP.

**Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: PASS

**Step 7: Commit**

```bash
git add components/features/dashboard/dashboard-content.tsx
git commit -m "refactor: remove duplicate category bar chart from dashboard"
```

---

## Task 2: Build + test verification

**Step 1: Typecheck**

```bash
npm run typecheck
```

**Step 2: Test**

```bash
npm run test
```

Expected: All pass (gak ada test yang nyentuh component ini).

**Step 3: Build**

```bash
npm run build
```

Expected: No errors.

**Step 4: Commit (kalau ada perubahan)**

---

## Ringkasan

| File | Perubahan | Lines |
|------|-----------|-------|
| `components/features/dashboard/dashboard-content.tsx` | Hapus bar chart card + `BadgeLike` function + simplifikasi grid parent | ~ -55 |

**1 file, 1 commit.**
