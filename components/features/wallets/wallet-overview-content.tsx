"use client";

import { createBalanceAdjustment } from "@/app/actions/transactions";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { SubmitButton } from "@/components/ui/submit-button";
import type { WalletOverviewData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, getCurrentTimeString, getTodayDateString } from "@/lib/utils";
import { useState } from "react";

export function WalletOverviewContent({ data }: { data: WalletOverviewData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}`;
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";

  return (
    <AppShell
      currentPath="/wallets"
      title={t("wallets.pageTitle")}
      subtitle={t("wallets.overviewSubtitle", { walletName: data.walletName })}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t("wallets.overviewAvailableLabel")} value={data.wallet.availableBalance} detail={t("wallets.overviewAvailableDetail")} />
        <StatCard label={t("wallets.overviewSavingLabel")} value={data.wallet.savingBalance} detail={t("wallets.overviewSavingDetail")} />
        <StatCard label={t("wallets.overviewTotalLabel")} value={data.wallet.totalBalance} detail={t("wallets.overviewTotalDetail")} />
        <StatCard label={t("wallets.overviewBudgetLabel")} value={data.wallet.budgetThisMonth} detail={t("wallets.overviewBudgetDetail")} />
        <StatCard label={t("wallets.overviewExpenseLabel")} value={data.wallet.spentThisMonth} detail={t("wallets.overviewExpenseDetail")} />
      </section>

      {canMutate ? (
        <section className="mt-4">
          <Collapsible open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">{t("transactions.balanceAdjustmentEyebrow")}</p>
                  <h3 className="headline-md mt-2">{t("transactions.balanceAdjustmentTitle")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("transactions.balanceAdjustmentDescription")}
                  </p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant={adjustmentOpen ? "soft" : "ghost"}
                  >
                    {adjustmentOpen ? t("common.closeEditor") : t("transactions.editButton")}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <ActionForm
                  action={createBalanceAdjustment}
                  className="mt-4 border-t border-border pt-4"
                  resetOnSuccess
                  onSuccess={() => setAdjustmentOpen(false)}
                >
                  <input type="hidden" name="wallet_id" value={data.walletId} />
                  <div className="grid min-w-0 gap-4">
                    <div className="glass-panel rounded-2xl p-4">
                      <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {t("transactions.balanceAdjustmentRecordedBalanceLabel")}
                      </p>
                      <p className="metric mt-3 text-xl text-foreground">
                        {formatCurrency(data.wallet.availableBalance, locale, data.wallet.currency)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t("transactions.balanceAdjustmentAutoDirectionHint")}
                      </p>
                    </div>
                    <label className="block">
                      <span className="mb-2 block font-label text-sm text-muted-foreground">
                        {t("transactions.balanceAdjustmentActualBalanceLabel")}
                      </span>
                      <CurrencyInput
                        allowNegative
                        name="actual_balance"
                        placeholder="Rp0"
                        required
                        currency={data.wallet.currency}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-label text-sm text-muted-foreground">
                        {t("transactions.balanceAdjustmentReasonLabel")}
                      </span>
                      <input name="note" placeholder={t("transactions.balanceAdjustmentReasonPlaceholder")} required />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block font-label text-sm text-muted-foreground">
                          {t("transactions.balanceAdjustmentDateLabel")}
                        </span>
                        <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
                      </label>
                      <label className="block">
                        <span className="mb-2 block font-label text-sm text-muted-foreground">
                          {t("transactions.balanceAdjustmentTimeLabel")}
                        </span>
                        <input name="happened_at_time" type="time" defaultValue={getCurrentTimeString()} />
                      </label>
                    </div>
                    <SubmitButton pendingText={t("transactions.balanceAdjustmentSavePending")}>
                      {t("transactions.balanceAdjustmentSave")}
                    </SubmitButton>
                  </div>
                </ActionForm>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </section>
      ) : null}

      <section className="mt-4 wallet-grid">
        <div className="card md:col-span-2">
          <p className="eyebrow">{t("wallets.activityEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("wallets.activityTitle")}</h3>
          {!data.hasTransactions ? (
            <div className="mt-6">
              <EmptyState title={t("wallets.activityEmptyTitle")} description={t("wallets.activityEmptyDescription")} />
            </div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="info-tile">
                <p className="font-medium">{t("wallets.activityTransactions")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t("wallets.activityTransactionsDescription", { count: data.transactionCount })}</p>
              </div>
              <div className="info-tile">
                <p className="font-medium">{t("wallets.activityCategories")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t("wallets.activityCategoriesDescription", { count: data.categoryCount })}</p>
              </div>
              <div className="info-tile">
                <p className="font-medium">{t("wallets.activityBudgets")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t("wallets.activityBudgetsDescription", { count: data.activeBudgetCount })}</p>
              </div>
              <div className="info-tile">
                <p className="font-medium">{t("wallets.activityTemplates")}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t("wallets.activityTemplatesDescription", { count: data.templateCount })}</p>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <p className="eyebrow">{t("wallets.roleEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("wallets.roleTitle")}</h3>
          <div className="mt-6 stack-list text-sm">
            {data.roleSummary.map((role) => (
              <div key={role.role} className="list-card">
                <p className="font-medium capitalize">{t(`wallets.role${role.role.charAt(0).toUpperCase()}${role.role.slice(1)}`)}</p>
                <p className="mt-2 text-muted-foreground">
                  {t("wallets.roleSummary", {
                    count: role.count,
                    role: t(`wallets.role${role.role.charAt(0).toUpperCase()}${role.role.slice(1)}`)
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
