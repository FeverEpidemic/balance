"use client";

import { createBudget, deleteBudget, updateBudget } from "@/app/actions/budgets";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEditPanel } from "@/components/ui/inline-edit-panel";
import { SubmitButton } from "@/components/ui/submit-button";
import type { BudgetsPageData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

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
  return (
    <div className="list-card">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium">{budget.categoryName}</p>
        <p className="metric text-sm">{formatCurrency(budget.amount)}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white">
        <div className={`h-2 rounded-full ${budget.ratio > 85 ? "bg-danger" : "bg-primary"}`} style={{ width: `${budget.ratio}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{budget.usageLabel}</p>
      <ActionForm action={updateBudget} className="mt-4">
        {({ state }) => (
          <InlineEditPanel
            buttonLabel={t("budgets.editButton")}
            closeSignal={state.status === "success" ? state : null}
            description={t("budgets.editDescription")}
            title={t("budgets.editTitle")}
          >
            <input type="hidden" name="wallet_id" value={walletId} />
            <input type="hidden" name="budget_id" value={budget.id} />
            <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,140px)_minmax(0,140px)_auto]">
              <label className="block">
                <span className="mb-2 block font-label text-xs text-muted-foreground">{t("budgets.categoryLabel")}</span>
                <select name="category_id" defaultValue={budget.categoryId} required>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
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
                <SubmitButton className="w-full md:w-auto" pendingText={t("budgets.updatePending")} variant="soft">
                  {t("budgets.updateButton")}
                </SubmitButton>
              </div>
            </div>
          </InlineEditPanel>
        )}
      </ActionForm>
      <ActionForm action={deleteBudget} className="mt-2 w-full sm:w-auto">
        <input type="hidden" name="wallet_id" value={walletId} />
        <input type="hidden" name="budget_id" value={budget.id} />
        <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage={t("budgets.deleteConfirm")} pendingText={t("budgets.deletePending")} variant="ghost">
          {t("budgets.deleteButton")}
        </ConfirmSubmitButton>
      </ActionForm>
    </div>
  );
}

export function BudgetsPageContent({ data }: { data: BudgetsPageData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}/budgets`;

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
