# UI Improvements — Implementation Plan

> **Executor options:**
> - **Hermes** — execute task-by-task, commit after each
> - **Manual** — follow steps directly

**Goal:** Improve Balance's core UI with high-impact, quick-to-implement visual enhancements that make daily money tracking feel more premium, responsive, and actionable.

**Architecture:** All changes are client-side React components and CSS. No database changes, no new API endpoints, no new dependencies. Each improvement is self-contained in one or two component files.

**Dark mode:** Both light and dark mode are first-class surfaces per `DESIGN.md`. Every task MUST verify both themes. Use theme CSS variables (`--primary`, `--surface`, `--border`, etc.) — never hardcoded colors. Static colors like `#d4a72c` (amber) for progress bars are acceptable only when they work on both cream and dark moss backgrounds.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS, Recharts (existing), shadcn/ui primitives

---

## Task 1: Floating Action Button (FAB) for Quick-Add Transaction

**Objective:** Add a sticky FAB at the bottom-right of every page on mobile so users can add a transaction from anywhere without scrolling to the header.

**Files:**
- Modify: `components/app-shell.tsx` (add FAB after mobile nav)
- No new components needed — reuse `TransactionCreateDialogButton`

**Design decision:** The FAB replaces the mobile header "Tambah Transaksi" button — not both visible at once. On desktop, the header button remains as-is (no FAB on desktop).

Current state in `app-shell.tsx`:
- Line 199 — Mobile header button (`md:hidden`): visible on <768px
- Line 208 — Desktop header button (`hidden md:flex`): visible on ≥768px

**Changes needed in AppShell:**
1. Add optional `fabTransactionContext?: TransactionCreateContext` prop
2. When FAB is active → **hide** the mobile header button (line 199) by adding a check
3. Keep desktop header button unchanged
4. Render FAB below the nav on mobile

**Step 1a: Add `fabTransactionContext` prop + FAB rendering**

In `components/app-shell.tsx`, add to props:

```tsx
fabTransactionContext?: TransactionCreateContext;
```

After the mobile `<nav>` block, add:

```tsx
{/* FAB — replaces mobile header button */}
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

**Step 1b: Hide mobile header button when FAB is active**

Change line 199 from:
```tsx
{headerAction ? <div className="shrink-0 md:hidden">{headerAction}</div> : null}
```
To:
```tsx
{headerAction && !fabTransactionContext ? <div className="shrink-0 md:hidden">{headerAction}</div> : null}
```

This ensures the mobile add-transaction button is removed from the header when the FAB is present, while the desktop button remains untouched (line 208).

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
- FAB has proper dark mode styling (uses `--primary` and `--button-primary-text` CSS vars → auto-adapt)
- FAB icon visible on dark backgrounds (inherits button color)

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

The budget cap can be computed from existing fields in `DashboardData`:
- `totalAvailableBudget` = remaining (sum of `budgetThisMonth - spentThisMonth` across wallets)
- `totalExpenseThisMonth` = total spent

**Budget cap = `totalAvailableBudget + totalExpenseThisMonth`** (approximate — accurate when all spending was against budgets). No new data layer fields needed.

```tsx
<StatCard
  label={t("dashboard.availableBudgetLabel")}
  value={dashboard.totalAvailableBudget}
  detail={t("dashboard.availableBudgetDetail")}
  progressValue={dashboard.totalExpenseThisMonth}
  progressMax={dashboard.totalAvailableBudget + dashboard.totalExpenseThisMonth}
  progressLabel={t("dashboard.budgetProgressLabel")}
/>
```

**Note:** The cap is approximate because `totalAvailableBudget` only sums wallets with `budgetThisMonth > 0`. If some spending happened outside budgeted wallets, the cap will be slightly higher than the true budget cap. This is acceptable for a visual indicator — the progress bar communicates "you're at X% of your budget" which the approximation handles well.

**Step 3: Verify**

- Dashboard shows progress bar on "Available Budget" card
- Bar color changes based on usage (green → amber → red)
- Numbers format correctly for IDR
- Works in both light and dark mode
- Doesn't break when budget is 0 or undefined

**Step 4: Commit**

```bash
git add components/ui/stat-card.tsx components/features/dashboard/dashboard-content.tsx
git commit -m "ui: add budget progress bar to dashboard stat card"
```

---

## Task 3: Spending by Category — Donut Chart

**Objective:** Add a donut/ring chart on the dashboard showing spending breakdown by category for the current month, using the existing `dashboard.categorySpend` data.

**Files:**
- Create: `components/features/dashboard/dashboard-category-breakdown.tsx`
- Modify: `components/features/dashboard/dashboard-content.tsx` (add the new section)

**Important:** `DashboardData` already has `categorySpend: DashboardCategorySpend[]` with `{name, value, color}` — populated from actual category data in the DB. **No new query, no data layer changes needed.** The mapper (`lib/data/mappers.ts` line 855) calls `buildCategorySpend()` which aggregates transactions by category with their real colors.

**Step 1: Create donut chart component**

`components/features/dashboard/dashboard-category-breakdown.tsx`:

```tsx
"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardCategorySpend } from "@/lib/data";

export function DashboardCategoryBreakdown({
  categories,
}: {
  categories: DashboardCategorySpend[];
}) {
  const locale = useLocale();
  const t = getTranslator(locale);

  if (categories.length === 0) return null;

  return (
    <div className="card">
      <p className="eyebrow">{t("dashboard.categoryEyebrow")}</p>
      <h3 className="headline-md mt-2">{t("dashboard.categoryTitle")}</h3>
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
                dataKey="value"
                nameKey="name"
              >
                {categories.map((cat, index) => (
                  <Cell key={`cell-${cat.name}`} fill={cat.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value, locale)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 truncate">{cat.name}</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(cat.value, locale)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Key design decisions:**
- Uses `cat.color` from the data (not hardcoded palette) — works in both light and dark mode because category colors are chosen by the user/seed from a palette that's visible on both backgrounds.
- Uses `dataKey="value"` and `nameKey="name"` to map directly to `DashboardCategorySpend` fields.
- The `Cell` key uses `cat.name` for stable React identity.

**Step 2: Add to dashboard**

In `dashboard-content.tsx`, after the daily expense chart section:

```tsx
<DashboardCategoryBreakdown categories={dashboard.categorySpend} />
```

**Step 3: Add i18n keys**

Add to translation files:
- `dashboard.categoryEyebrow` → "Pengeluaran Bulan Ini"
- `dashboard.categoryTitle` → "Berdasarkan Kategori"

**Step 4: Verify**

- Dashboard shows a donut chart with category breakdown
- Hover shows tooltip with formatted currency
- Legend uses category colors from the database
- Works in both light and dark mode (colors from DB)
- Donut has a hole in the center (ring style)
- Empty state handled (`categories.length === 0` → no chart shown)
- **Dark mode check:** Category colors visible on dark background, tooltip text legible

**Step 5: Commit**

```bash
git add components/features/dashboard/dashboard-category-breakdown.tsx components/features/dashboard/dashboard-content.tsx
git commit -m "ui: add spending by category donut chart to dashboard"
```

---

## Task 4: Pull-to-Refresh for Mobile Pages

**Objective:** Add a simple touch-based pull-to-refresh gesture on mobile so users can refresh dashboard/transaction data without navigating away or hard-refreshing the page.

**Files:**
- Create: `components/ui/pull-to-refresh.tsx`
- Modify: `components/features/dashboard/dashboard-content.tsx`
- Modify: `components/features/transactions/transactions-page-content.tsx`

**Why:** On mobile web, users expect to pull down to refresh data. Currently they'd have to navigate away and back, or hard refresh. Standard pattern for any finance app.

**How it works:** Wraps content in a touch gesture handler. When the page is scrolled to top and user pulls down > 80px, calls `router.refresh()` which triggers Next.js Server Component re-render, fetching fresh data from the server.

**Pitfalls & design notes:**
- `router.refresh()` re-renders the entire Server Component tree (full data refresh). This may cause a brief flash of loading state — acceptable trade-off for clean data refresh without a custom state management layer.
- Only activates when `window.scrollY <= 0` (at the top of the page) — won't interfere with normal scrolling.
- Desktop completely unaffected (no touch events fire).
- Spinner uses Tailwind's built-in `animate-spin` — no custom CSS needed.
- **Dark mode:** The spinner uses `border-primary` + `border-t-transparent` — works on both light and dark backgrounds since `--primary` is theme-aware.
- **Accessibility:** Touch event only, no keyboard equivalent needed (desktop has no refresh gesture).
- If the page content doesn't fill the viewport, the pull gesture may feel awkward — test on pages with few transactions.

**Step 1: Create PullToRefresh component**

`components/ui/pull-to-refresh.tsx` — touch gesture wrapper with rubber-band pull indicator and spinner. On release past 80px threshold, calls `router.refresh()`. Desktop unaffected (no touch events).

**Step 2: Wrap mobile content**

In `dashboard-content.tsx` and `transactions-page-content.tsx`, wrap the main content area with `<PullToRefresh>` on mobile only.

**Step 3: Verify**
- Pull down on mobile dashboard → spinner + refresh
- Does NOT interfere with normal scrolling
- Desktop = no effect

**Step 4: Commit**
```bash
git add components/ui/pull-to-refresh.tsx components/features/dashboard/dashboard-content.tsx components/features/transactions/transactions-page-content.tsx
git commit -m "ui: add pull-to-refresh gesture on mobile for dashboard and transactions"
```

---

## Task 5: Animated Number Transitions on Stat Cards

**Objective:** Smoothly animate stat card values (balance, budget, savings) when they change — count up/down instead of instant jump.

**Files:**
- Create: `components/ui/animated-number.tsx`
- Modify: `components/ui/stat-card.tsx`

**Why:** Numbers jumping instantly feels jarring, especially in a finance app. A subtle 400ms count-up/down animation makes the app feel premium (like Linear, Revolut, etc.).

**Step 1: Create AnimatedNumber component**

`components/ui/animated-number.tsx` — React hook using `requestAnimationFrame` with ease-out cubic curve. Renders the animated value while maintaining the real value in DOM for accessibility.

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Animates a number from its CURRENT displayed value to the target value.
 * Handles mid-animation value changes gracefully by aborting the old animation
 * and starting fresh from the current display value.
 *
 * Uses requestAnimationFrame with ease-out cubic curve (~400ms).
 * Respects prefers-reduced-motion: skips animation entirely.
 */
export function AnimatedNumber({
  value,
  formatter = (v) => String(v),
  className,
  duration = 400,
}: {
  value: number;
  formatter?: (value: number) => string;
  className?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const rafId = useRef<number>();
  // Track the CURRENT display value to use as animation start point
  const currentDisplayRef = useRef(value);

  useEffect(() => {
    // Respect reduced-motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      currentDisplayRef.current = value;
      return;
    }

    // Abort any in-flight animation
    if (rafId.current) cancelAnimationFrame(rafId.current);

    const startValue = currentDisplayRef.current;
    const diff = value - startValue;
    if (diff === 0) return;

    const startTime = performance.now();
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * eased);
      setDisplayValue(current);
      currentDisplayRef.current = current;
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        currentDisplayRef.current = value;
      }
    }
    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [value, duration]);

  return <span className={cn("tabular-nums", className)}>{formatter(displayValue)}</span>;
}
```

**Step 2: Use in StatCard**

Replace `{formatCurrency(value, "id", currency)}` with `<AnimatedNumber value={value} formatter={(v) => formatCurrency(v, "id", currency)} />`.

**Step 3: Verify**
- Dashboard numbers animate smoothly on page load (count up from 0)
- 400ms ease-out curve, not distracting
- Changing values mid-animation starts fresh from current display (no jump)
- Respects `prefers-reduced-motion: reduce` — numbers appear instantly with no animation
- Works with and without currency formatting
- Screen readers read the real DOM value (displayValue is the final number after animation)

**Step 4: Commit**
```bash
git add components/ui/animated-number.tsx components/ui/stat-card.tsx
git commit -m "ui: add smooth animated number transitions to stat cards"
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

### Quick Win C: Animated Page Transitions (CSS-only)

**Files:** `app/globals.css` (add keyframe), `components/ui/route-transition.tsx` (check if it exists)

Wrap `<main>` content in a simple fade-in animation on route change using pure CSS (no extra dependency):

```tsx
"use client";
export function RouteTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-fade-in">
      {children}
    </div>
  );
}
```

Add to `app/globals.css`:
```css
@keyframes page-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-page-fade-in {
  animation: page-fade-in 200ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .animate-page-fade-in {
    animation: none;
  }
}
```

**Effort:** 30 minutes (CSS-only, no new dependency)

---

## Testing Guidance

Per `AGENTS.md` and `docs/TESTING_GUIDE.md`: pure functions and helpers should have unit tests.

**Testable pure functions in this plan:**

- `getProgressColor` from Task 2 — color thresholds (0→50→80→100%)
- `AnimatedNumber` — skips animation when `prefers-reduced-motion`, formats via callback

**Test file:** `tests/unit/ui-improvements.test.ts`

```tsx
import { describe, it, expect } from "vitest";

// Extract getProgressColor as export for testing
function getProgressColor(current: number, max: number): string {
  const ratio = current / max;
  if (ratio <= 0.5) return "var(--success)";
  if (ratio <= 0.8) return "#d4a72c";
  return "var(--danger)";
}

describe("getProgressColor", () => {
  it("returns success when under 50%", () => {
    expect(getProgressColor(25, 100)).toBe("var(--success)");
  });
  it("returns amber between 50-80%", () => {
    expect(getProgressColor(60, 100)).toBe("#d4a72c");
  });
  it("returns danger above 80%", () => {
    expect(getProgressColor(90, 100)).toBe("var(--danger)");
  });
  it("returns success at exactly 50%", () => {
    expect(getProgressColor(50, 100)).toBe("var(--success)");
  });
});
```

**Run:** `npm run test`

For component-level tests (Task 3, 5), verify manually via the UI — the interaction complexity (touch gestures, chart rendering, animations) doesn't justify the test overhead for this phase.

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
| 3 | Category Donut Chart | 1-2h | ⭐⭐⭐ | new component, dashboard only |
| 4 | Pull-to-Refresh Mobile | 1-2h | ⭐⭐⭐ | pull-to-refresh, dashboard, transactions |
| 5 | Animated Number Transitions | 1h | ⭐⭐⭐ | animated-number, stat-card |
| A | Dynamic Greeting | 15min | ⭐⭐ | app-shell |
| B | Empty State Illustrations | 30min | ⭐⭐ | empty-state |
| C | Page Transitions | 1h | ⭐⭐ | route-transition, globals.css |

**Recommendation:** Execute in order 1→2→3→4→5 for max impact. Quick wins (A/B/C) can be sprinkled between tasks.
