import { notFound } from "next/navigation";
import { ExportPdfButton } from "@/components/features/reports/export-pdf-button";
import { requireUser } from "@/lib/auth";
import { buildMonthlyReport, getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage({ params }: { params: Promise<{ locale: string; walletId: string }> }) {
  const { locale: localeParam, walletId } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  const active = `/wallets/${walletId}/reports`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  const monthlyReport = buildMonthlyReport(bundle.transactions, locale);
  const maxIncome = Math.max(...monthlyReport.map((item) => Math.max(item.income, item.expense)), 1);

  return (
    <AppShell
      currentPath={active}
      title={t("reports.pageTitle")}
      subtitle={t("reports.pageSubtitle", { walletName: bundle.wallet.name })}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
      headerAction={<ExportPdfButton walletId={walletId} />}
    >
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card">
          <p className="eyebrow">{t("reports.trendEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("reports.trendTitle")}</h3>
          {monthlyReport.length === 0 ? <div className="mt-6"><EmptyState title={t("reports.emptyTitle")} description={t("reports.emptyDescription")} /></div> : null}
          <div className="mt-8 overflow-x-auto">
            <div className="grid min-w-[340px] grid-cols-5 gap-3 sm:gap-4">
            {monthlyReport.map((row) => (
              <div key={row.month} className="flex min-w-[52px] flex-col items-center gap-3">
                <div className="flex h-56 items-end gap-2 sm:h-64">
                  <div className="w-4 rounded-full bg-[#bec4a0] sm:w-5" style={{ height: `${(row.income / maxIncome) * 100}%` }} />
                  <div className="w-4 rounded-full bg-primary sm:w-5" style={{ height: `${(row.expense / maxIncome) * 100}%` }} />
                </div>
                <p className="font-label text-xs text-muted-foreground">{row.label}</p>
              </div>
            ))}
            </div>
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">{t("reports.insightEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("reports.insightTitle")}</h3>
          <div className="mt-6 space-y-3">
            <div className="info-tile">
              <p className="text-sm text-muted-foreground">{t("reports.incomeLabel")}</p>
              <p className="metric mt-2 text-2xl">{formatCurrency(monthlyReport.at(-1)?.income ?? 0)}</p>
            </div>
            <div className="info-tile">
              <p className="text-sm text-muted-foreground">{t("reports.expenseLabel")}</p>
              <p className="metric mt-2 text-2xl">{formatCurrency(monthlyReport.at(-1)?.expense ?? 0)}</p>
            </div>
            <div className="info-tile">
              <p className="text-sm text-muted-foreground">{t("reports.remainingBudgetLabel")}</p>
              <p className="metric mt-2 text-2xl">{formatCurrency(Math.max(bundle.wallet.budgetThisMonth - bundle.wallet.spentThisMonth, 0))}</p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
