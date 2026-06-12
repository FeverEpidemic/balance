"use client";

import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import type { WalletOverviewData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";

export function WalletOverviewContent({ data }: { data: WalletOverviewData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}`;

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
