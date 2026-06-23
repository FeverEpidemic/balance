# Total Budget Header di Page Budgets

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Tambah ringkasan total anggaran bulan ini di header halaman Budgets.

**Architecture:** Client-side reduce dari `data.budgets` yang udah ada. Tidak perlu server change. Total anggaran + total terpakai + progress bar ditampilkan via `headerBody` prop AppShell.

**Tech Stack:** React, Tailwind CSS, `formatCurrency`.

---

## Layout Header

```
┌──────────────────────────────────────────────────────────┐
│  ANGGARAN                                                 │  ← eyebrow
│  Anggaran — Dompet Keluarga                    [stats]    │  ← subtitle + stats card
│  Kelola anggaran per kategori biar pengeluaran terkendali.│  ← description
│                                                          │
│  ┌─────────────────────────────────────────────────┐     │
│  │ TOTAL ANGGARAN BULAN INI                        │     │  ← label (eyebrow style)
│  │ Rp 12.500.000                                   │     │  ← metric (large)
│  │ ██████████████░░░░░░░ 66%                       │     │  ← progress bar
│  │ Terpakai Rp 8.200.000 dari Rp 12.500.000        │     │  ← detail
│  └─────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

Elemen headerBody: label → metric → progress bar → detail text. Semua dibungkus dalam card style (`rounded-xl bg-card p-4 shadow-serene`).

Kalau tidak ada budget → headerBody undefined (tidak muncul).

---

## Task 1: Tambah i18n keys

**Objective:** Label "Total Anggaran", "Terpakai", dan detail text.

**Files:**
- Modify: `messages/id.json`
- Modify: `messages/en.json`

**Step 1: Tambah keys di `messages/id.json`**

Di dalam objek `budgets`, tambah setelah key yang ada:

```json
"totalBudgetLabel": "Total anggaran bulan ini",
"totalUsedDetail": "Terpakai {used} dari {total}",
```

**Step 2: Tambah keys di `messages/en.json`**

```json
"totalBudgetLabel": "Total budget this month",
"totalUsedDetail": "Used {used} of {total}",
```

**Step 3: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "feat: add budget total header i18n keys"
```

---

## Task 2: Tambah headerBody dengan total budget di BudgetsPageContent

**Objective:** Render ringkasan total budget di header halaman.

**Files:**
- Modify: `components/features/budgets/budgets-page-content.tsx`

**Step 1: Hitung total di dalam component**

Di `BudgetsPageContent`, sebelum return (setelah line 99), tambah:

```tsx
  const totalBudget = data.budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalUsed = data.budgets.reduce((sum, b) => sum + b.used, 0);
  const usagePercent = totalBudget > 0 ? Math.min(Math.round((totalUsed / totalBudget) * 100), 100) : 0;
```

**Step 2: Tambah `headerBody` di AppShell**

Di prop AppShell, tambah `headerBody`:

```tsx
    <AppShell
      currentPath={active}
      title={t("budgets.pageTitle")}
      subtitle={t("budgets.pageSubtitle", { walletName: data.walletName })}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
      headerBody={
        data.budgets.length > 0 ? (
          <div className="rounded-xl bg-card p-4 shadow-serene border border-[color:var(--soft-border)]">
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-strong">
              {t("budgets.totalBudgetLabel")}
            </p>
            <p className="metric mt-2 text-2xl text-foreground">
              {formatCurrency(totalBudget)}
            </p>
            <div className="mt-3 h-2.5 rounded-full bg-muted">
              <div
                className="h-2.5 rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-soft-strong))]"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("budgets.totalUsedDetail", {
                used: formatCurrency(totalUsed),
                total: formatCurrency(totalBudget)
              })}
            </p>
          </div>
        ) : undefined
      }
    >
```

**Step 3: Commit**

```bash
git add components/features/budgets/budgets-page-content.tsx
git commit -m "feat: add total budget summary to budgets page header"
```

---

## Task 3: Typecheck, test, build

**Objective:** Verifikasi semua perubahan.

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

**Step 3: Manual visual check**

- [ ] Page Budgets dengan 3 budget → header tampil total, progress bar, detail
- [ ] Progress bar 0% → tidak ada bar hijau
- [ ] Progress bar 100% → bar penuh
- [ ] Ganti bulan via filter → total update sesuai bulan yang dipilih
- [ ] Page Budgets kosong (belum ada budget) → headerBody tidak muncul
- [ ] Dark mode → card tetap readable
- [ ] Mobile → layout tetap oke

---

## Summary

| File | Change | Line delta |
|------|--------|------------|
| `components/features/budgets/budgets-page-content.tsx` | +3 lines compute, +18 lines headerBody | ~+21 |
| `messages/id.json` | +2 keys | +2 |
| `messages/en.json` | +2 keys | +2 |

**Total: ~25 lines across 3 files. 3 tasks.**

### Yang TIDAK berubah:
- Create budget form tidak berubah
- Budget list items tidak berubah
- Month filter tidak berubah
- Server-side data fetching tidak berubah
- Semua action (create, update, delete budget) tidak berubah
