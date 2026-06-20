# UI Improvements — Implementation Plan

> **Executor options:**
> - **Hermes** — execute task-by-task, commit after each
> - **Manual** — follow steps directly

**Goal:** Improve Balance's core UI with high-impact, quick-to-implement visual enhancements that make daily money tracking feel more premium, responsive, and actionable.

**Architecture:** All changes are client-side React components and CSS. No database changes, no new API endpoints, no new dependencies. Each improvement is self-contained in one or two component files.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS, Recharts (existing), shadcn/ui primitives

---

## Task 1: Floating Action Button (FAB) for Quick-Add Transaction

**Objective:** Add a sticky FAB at the bottom-right of every page on mobile so users can add a transaction from anywhere without scrolling to the header.

**Files:**
- Modify: `components/app-shell.tsx` (add FAB after mobile nav)
- No new components needed — reuse `TransactionCreateDialogButton`

**Step 1: Add FAB to AppShell**

In `components/app-shell.tsx`, after the mobile `<nav>` block (line 292), add:

```tsx
{/* Mobile FAB — quick-add from anywhere */}
{!isDesktop ? (
  <div className="fixed bottom-24 right-5 z-40 lg:hidden">
    <TransactionCreateDialogButton
      context={/* need wallet context */}
      label=""
      className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[var(--button-primary-text)] shadow-float transition hover:bg-primary-hover active:scale-95"
      iconOnly
    />
  </div>
) : null}
```

**Issue:** `AppShell` doesn't currently have access to `createTransactionContext`. Need to either:
- Pass it as an optional prop to `AppShell`
- Or render the FAB in each page that has the context

**Recommended approach:** Add optional `fabTransactionContext` prop to `AppShell`, render FAB only when context is available. Each page passes it from its data.

```tsx
// In AppShell props:
fabTransactionContext?: TransactionCreateContext;

// In render:
{!isDesktop && fabTransactionContext ? (
  <div className="fixed bottom-24 right-5 z-40 lg:hidden">
    <TransactionCreateDialogButton
      context={fabTransactionContext}
      label=""
      iconOnly
      className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[var(--button-primary-text)] shadow-float transition hover:bg-primary-hover active:scale-95"
    />
  </div>
) : null}
```

**Step 2: Update `TransactionCreateDialogButton` to support `iconOnly` mode**

In `components/features/transactions/transaction-create-dialog-button.tsx`, add `iconOnly?: boolean` prop. When true, render just the plus icon without text label.

**Step 3: Pass context from all main pages**

- `DashboardContent` — already has `dashboard.createTransactionContext` → pass to `AppShell`
- `WalletOverviewContent` — may need to add context loading
- `TransactionsPageContent` — already has transaction create context
- `ChatPageContent` — for now, skip (chat is its own flow)

**Step 4: Verify**

- Open app on mobile viewport
- FAB appears at bottom-right, above the nav bar
- Clicking opens the transaction dialog
- FAB doesn't appear on desktop
- FAB has proper dark mode styling

**Step 5: Commit**

```bash
git add components/app-shell.tsx components/features/transactions/transaction-create-dialog-button.tsx
git commit -m "ui: add floating action button for quick-add on mobile"
```

---

## Task 2: Budget Progress Bar on StatCard

**Objective:** Replace the current text-only budget stat card with a visual progress bar showing how much of the monthly budget has been used, with color coding (green → yellow → red).

**Files:**
- Modify: `components/ui/stat-card.tsx` (add optional progress bar)
- Modify: `components/features/dashboard/dashboard-content.tsx` (pass budget context to StatCard)

**Step 1: Add budget progress props to StatCard**

Currently `StatCard` has `{ label, value, detail, currency }`. Add optional `{ progressValue?: number; progressMax?: number; progressLabel?: string }`.

When `progressMax` is provided and > 0, render a progress bar below the value:

```tsx
{progressMax !== undefined && progressMax > 0 && progressValue !== undefined ? (
  <div className="mt-2">
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{formatCurrency(progressValue, "id", currency)}</span>
      <span>{formatCurrency(progressMax, "id", currency)}</span>
    </div>
    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min((progressValue / progressMax) * 100, 100)}%`,
          backgroundColor: getProgressColor(progressValue, progressMax),
        }}
      />
    </div>
    {progressLabel ? (
      <p className="mt-1 text-xs text-muted-foreground">{progressLabel}</p>
    ) : null}
  </div>
) : null}
```

Where `getProgressColor` is:
```tsx
function getProgressColor(current: number, max: number): string {
  const ratio = current / max;
  // Safari green < 50%, amber < 80%, red > 80%
  if (ratio <= 0.5) return "var(--success)";
  if (ratio <= 0.8) return "#d4a72c"; /* amber */
  return "var(--danger)";
}
```

**Step 2: Wire up dashboard budget stat**

In `dashboard-content.tsx`, the "Available Budget" StatCard currently renders:

```tsx
<StatCard
  label={t("dashboard.availableBudgetLabel")}
  value={dashboard.totalAvailableBudget}
  detail={t("dashboard.availableBudgetDetail")}
/>
```

The `dashboard.totalAvailableBudget` is the remaining budget. Need to also pass the original budget total. Check `DashboardData` type — if `totalBudgetAmount` (the cap) is available, pass it:

```tsx
<StatCard
  label={t("dashboard.availableBudgetLabel")}
  value={dashboard.totalAvailableBudget}
  detail={t("dashboard.availableBudgetDetail")}
  progressValue={dashboard.totalSpentThisMonth}  // amount spent
  progressMax={dashboard.totalBudgetAmount}       // budget cap
  progressLabel={t("dashboard.budgetProgressLabel")}
/>
```

**Note:** If `DashboardData` doesn't include `totalBudgetAmount` or `totalSpentThisMonth`, need to add those fields in the data layer:
- `lib/data/queries.ts` — add query for total budget and total spending
- `lib/data/index.ts` — add fields to `DashboardData` type
- `lib/data/mappers.ts` — map DB results

**Step 3: Verify**

- Dashboard shows progress bar on "Available Budget" card
- Bar color changes based on usage (green → amber → red)
- Numbers format correctly for IDR
- Works in both light and dark mode
- Doesn't break when budget is 0 or undefined

**Step 4: Commit**

```bash
git add components/ui/stat-card.tsx components/features/dashboard/dashboard-content.tsx lib/data/
git commit -m "ui: add budget progress bar to dashboard stat card"
```

---

## Task 3: Spending by Category — Donut Chart

**Objective:** Add a donut/ring chart below the daily expense chart on the dashboard, showing spending breakdown by category for the current month.

**Files:**
- Create: `components/features/dashboard/dashboard-category-breakdown.tsx`
- Modify: `components/features/dashboard/dashboard-content.tsx` (add the new section)
- Modify: `lib/data/queries.ts` (add query for category spend)
- Modify: `lib/data/types.ts` (add category spend type)

**Step 1: Create data query**

In `lib/data/queries.ts`, add a function to get spending by category for the current month:

```tsx
export async function getCategorySpending(walletIds: string[], userId: string) {
  const supabase = createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("transactions")
    .select("category_id, amount, categories(name)")
    .in("wallet_id", walletIds)
    .eq("kind", "expense")
    .gte("happened_at", startOfMonth)
    .throwOnError();

  // Aggregate by category
  const categoryMap = new Map<string, number>();
  for (const tx of data ?? []) {
    const name = (tx.categories as { name: string } | null)?.name ?? "Lainnya";
    categoryMap.set(name, (categoryMap.get(name) ?? 0) + Number(tx.amount));
  }

  return Array.from(categoryMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}
```

**Step 2: Create donut chart component**

`components/features/dashboard/dashboard-category-breakdown.tsx`:

```tsx
"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "var(--primary)",     // sage
  "#d4a72c",            // amber
  "var(--danger)",      // muted red
  "#5b8f62",            // green
  "#8b7e74",            // brown
  "#6b8e9e",            // steel blue
  "#b88a6b",            // tan
  "#7a8a6a",            // olive
];

type CategoryItem = { name: string; amount: number };

export function DashboardCategoryBreakdown({
  categories,
}: {
  categories: CategoryItem[];
}) {
  const locale = useLocale();

  if (categories.length === 0) return null;

  return (
    <div className="card">
      <p className="eyebrow">{/* t("dashboard.categoryEyebrow") */}</p>
      <h3 className="headline-md mt-2">{/* t("dashboard.categoryTitle") */}</h3>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="amount"
              >
                {categories.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {categories.map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="flex-1 truncate">{cat.name}</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(cat.amount, locale)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add to dashboard**

In `dashboard-content.tsx`, after the daily expense chart section, add:

```tsx
<DashboardCategoryBreakdown categories={dashboard.categorySpending} />
```

Add `categorySpending` to `DashboardData` type and populate it in the data layer.

**Step 4: Verify**

- Dashboard shows a donut chart with category breakdown
- Hover shows tooltip with formatted currency
- Legend shows all categories with color dots
- Works in both light and dark mode (colors use CSS variables)
- Donut has a hole in the center (ring style)
- Empty state handled (no categories = no chart shown)

**Step 5: Commit**

```bash
git add components/features/dashboard/dashboard-category-breakdown.tsx components/features/dashboard/dashboard-content.tsx lib/data/
git commit -m "ui: add spending by category donut chart to dashboard"
```

---

## Quick Wins (Optional — Pick & Choose)

### Quick Win A: Dynamic Greeting on Dashboard Header

**File:** `components/app-shell.tsx`

Replace static user display with time-based greeting:

```tsx
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

// In the mobile header section:
<p className="pl-14 text-sm text-muted-foreground">
  {getGreeting()}, {userName} ☀️
</p>
```

**Effort:** 15 minutes

### Quick Win B: Illustrations for Empty States

**Files:** `components/ui/empty-state.tsx`

Add optional `illustration` prop that renders a simple inline SVG. Create 3 reusable empty state SVGs: transactions (wallet), dashboard (chart), categories (tags). Keep them simple — geometric shapes in the sage/cream palette.

**Effort:** 30 minutes

### Quick Win C: Animated Page Transitions

**Files:** `components/ui/route-transition.tsx` (check if it exists), `components/app-shell.tsx`

Wrap `<main>` content in a simple fade-in animation on route change:

```tsx
"use client";
import { motion } from "framer-motion"; // or use CSS animation

export function RouteTransition({ children, key }: { children: React.ReactNode; key: string }) {
  return (
    <div
      key={key}
      className="animate-fadeIn"
      style={{ animation: "fadeIn 200ms ease-out" }}
    >
      {children}
    </div>
  );
}
```

Add `@keyframes fadeIn` to `globals.css`.

**Effort:** 1 hour (skip if framer-motion not already a dep)

---

## Deployment

After all tasks are implemented and committed:

```bash
git push origin main
# Wait for CI green
# Wait for Docker Publish green
ssh balance-vps "cd /home/ilham827/balance && docker compose pull app && docker compose up -d app scheduler"
```

---

## Summary

| # | Feature | Effort | Impact | Files Touched |
|---|---------|--------|--------|---------------|
| 1 | FAB Quick-Add | 2-3h | ⭐⭐⭐ | app-shell, dialog-button |
| 2 | Budget Progress Bar | 1-2h | ⭐⭐⭐ | stat-card, dashboard, data layer |
| 3 | Category Donut Chart | 2-3h | ⭐⭐⭐ | new component, dashboard, data layer |
| A | Dynamic Greeting | 15min | ⭐⭐ | app-shell |
| B | Empty State Illustrations | 30min | ⭐⭐ | empty-state |
| C | Page Transitions | 1h | ⭐⭐ | route-transition, globals.css |
