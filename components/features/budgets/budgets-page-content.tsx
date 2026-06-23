"use client";

import { createBudget, deleteBudget, updateBudget } from "@/app/actions/budgets";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { ActionForm } from "@/components/ui/action-form";
import { AppIcon, CategoryIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible";
import type { BudgetsPageData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

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

        {/* Right side: total budget amount (desktop only) */}
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

export function BudgetsPageContent({ data }: { data: BudgetsPageData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}/budgets`;

  const totalBudget = data.budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalUsed = data.budgets.reduce((sum, b) => sum + b.used, 0);
  const usagePercent = totalBudget > 0 ? Math.min(Math.round((totalUsed / totalBudget) * 100), 100) : 0;

  return (
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
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <p className="eyebrow">{t("budgets.createEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("budgets.createTitle")}</h3>
          <ActionForm action={createBudget} className="mt-6 grid min-w-0 gap-4" resetOnSuccess>
            <input type="hidden" name="wallet_id" value={data.walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("budgets.monthLabel")}</span>
              <input name="month_start" defaultValue={data.selectedMonth} type="month" required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("budgets.categoryLabel")}</span>
              <select name="category_id" defaultValue={data.categories[0]?.id ?? ""} required>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("budgets.limitLabel")}</span>
              <CurrencyInput name="amount" defaultValue={2500000} required />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="carry_over_enabled" type="checkbox" value="true" className="h-4 w-4 rounded border-muted-foreground" />
              <span className="text-muted-foreground">{t("budgets.carryOverLabel")}</span>
            </label>
            <SubmitButton pendingText={t("budgets.savePending")}>{t("budgets.saveButton")}</SubmitButton>
          </ActionForm>
        </div>
        <div className="card">
          <p className="eyebrow">{t("budgets.usageEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("budgets.usageTitle")}</h3>
          <form method="get" className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.historyMonthFilter")}</span>
              <input name="month" type="month" defaultValue={data.selectedMonth} />
            </label>
            <Button variant="soft" className="w-full sm:w-auto">
              {t("common.apply")}
            </Button>
            <Button href={`/wallets/${data.walletId}/budgets`} variant="ghost" className="w-full sm:w-auto">
              {t("common.reset")}
            </Button>
          </form>
          <div className="mt-6 stack-list">
            {data.budgets.length === 0 ? (
              <EmptyState title={t("budgets.emptyTitle")} description={t("budgets.emptyDescription")} />
            ) : null}
            {data.budgets.map((budget) => (
              <BudgetItem key={budget.id} budget={budget} categories={data.categories} walletId={data.walletId} t={t} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
