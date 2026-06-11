import { AppShell } from "@/components/app-shell";
import { DashboardAiInsight } from "@/components/features/dashboard/dashboard-ai-insight";
import { DashboardDailyExpenseChart } from "@/components/features/dashboard/dashboard-daily-expense-chart";
import { DashboardOnboardingCard } from "@/components/features/dashboard/dashboard-onboarding-card";
import { AppIcon, CategoryIcon } from "@/components/ui/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { createWallet } from "@/app/actions/wallets";
import type { DashboardData } from "@/lib/data";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import type { CSSProperties } from "react";

export function DashboardContent({
  dashboard,
  locale,
  feedback
}: {
  dashboard: DashboardData;
  locale: AppLocale;
  feedback?: { error?: string; message?: string };
}) {
  const t = getTranslator(locale);
  const transactionsHref = dashboard.shell.primaryWalletId ? `/wallets/${dashboard.shell.primaryWalletId}/transactions` : "/dashboard";
  const hasDailyExpenses = dashboard.dailyExpenses.some((item) => item.amount > 0);

  return (
    <AppShell
      currentPath="/dashboard"
      title={t("dashboard.title")}
      subtitle={t("dashboard.subtitle")}
      userName={dashboard.shell.userName}
      walletCount={dashboard.shell.walletCount}
      budgetCount={dashboard.shell.budgetCount}
      memberCount={dashboard.shell.memberCount}
      primaryWalletId={dashboard.shell.primaryWalletId}
      headerAction={
        <Button
          href={transactionsHref}
          variant="soft"
          className="min-h-[2.75rem] gap-2 rounded-full border border-border bg-overlay px-3 shadow-none hover:shadow-none"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card ring-1 ring-inset ring-border">
            <AppIcon name="plus" className="h-4 w-4" tone="primary" />
          </span>
          <span className="hidden sm:inline">{t("dashboard.addTransaction")}</span>
          <span className="sr-only sm:hidden">{t("dashboard.addTransaction")}</span>
        </Button>
      }
    >
      <DashboardOnboardingCard onboarding={dashboard.onboarding} />

      <ToastFeedback error={feedback?.error} message={feedback?.message} />
      <section className="glass-panel mb-4 grid gap-4 rounded-2xl p-4 xl:grid-cols-[1fr_360px]">
        <div>
          <p className="headline-md">{t("wallets.heroTitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("wallets.heroDescription")}</p>
        </div>
        <form action={createWallet} className="grid gap-3 rounded-2xl bg-muted p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("wallets.nameLabel")}</span>
              <input name="name" placeholder={t("wallets.namePlaceholder")} required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("wallets.kindLabel")}</span>
              <select name="kind" defaultValue="personal">
                <option value="personal">{t("wallets.kindPersonal")}</option>
                <option value="shared">{t("wallets.kindShared")}</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("wallets.setupPresetLabel")}</span>
              <select name="setup_preset" defaultValue="standard">
                <option value="minimal">{t("wallets.setupMinimal")}</option>
                <option value="standard">{t("wallets.setupStandard")}</option>
                <option value="family">{t("wallets.setupFamily")}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("wallets.budgetPresetLabel")}</span>
              <select name="budget_preset" defaultValue="balanced">
                <option value="none">{t("wallets.budgetPresetNone")}</option>
                <option value="light">{t("wallets.budgetPresetLight")}</option>
                <option value="balanced">{t("wallets.budgetPresetBalanced")}</option>
                <option value="ambitious">{t("wallets.budgetPresetAmbitious")}</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("wallets.presetDescription")}
          </p>
          <SubmitButton pendingText={t("wallets.createPending")}>{t("wallets.createButton")}</SubmitButton>
        </form>
      </section>

      <section id="ringkasan-finansial" className="grid gap-4 scroll-mt-28 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div className="card">
          <p className="eyebrow">{t("dashboard.title")}</p>
          <h3 className="headline-md mt-2 text-foreground">{t("dashboard.totalBalanceLabel")}</h3>
          <p className="metric mt-5 text-3xl text-foreground sm:text-4xl">{formatCurrency(dashboard.totalBalance)}</p>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">{t("dashboard.totalBalanceDetail")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="subtle-panel">
              <p className="text-sm text-muted-foreground">{t("dashboard.availableBalanceLabel")}</p>
              <p className="metric mt-2 text-xl">{formatCurrency(dashboard.totalAvailableBalance)}</p>
            </div>
            <div className="subtle-panel">
              <p className="text-sm text-muted-foreground">{t("dashboard.savingBalanceLabel")}</p>
              <p className="metric mt-2 text-xl">{formatCurrency(dashboard.totalSavingBalance)}</p>
            </div>
            <div className="subtle-panel sm:col-span-2 xl:col-span-1">
              <p className="text-sm text-muted-foreground">{t("dashboard.outstandingSplitLabel")}</p>
              <p className="metric mt-2 text-xl">{formatCurrency(dashboard.outstandingSplit)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <StatCard label={t("dashboard.monthExpenseLabel")} value={dashboard.totalExpenseThisMonth} detail={t("dashboard.monthExpenseDetail")} />
          <StatCard label={t("dashboard.availableBalanceLabel")} value={dashboard.totalAvailableBalance} detail={t("dashboard.availableBalanceDetail")} />
          <StatCard label={t("dashboard.savingBalanceLabel")} value={dashboard.totalSavingBalance} detail={t("dashboard.savingBalanceDetail")} />
        </div>
      </section>

      <DashboardAiInsight locale={locale} />

      <section className="mt-4 card">
        <p className="eyebrow">{t("dashboard.dailyExpenseEyebrow")}</p>
        <h3 className="headline-md mt-2">{t("dashboard.dailyExpenseTitle")}</h3>
        {hasDailyExpenses ? (
          <DashboardDailyExpenseChart dailyExpenses={dashboard.dailyExpenses} locale={locale} />
        ) : (
          <div className="mt-6">
            <EmptyState title={t("dashboard.dailyExpenseEmptyTitle")} description={t("dashboard.dailyExpenseEmptyDescription")} />
          </div>
        )}
      </section>

      <section className="mt-4 grid gap-4 2xl:grid-cols-12">
        <div className="card 2xl:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{t("dashboard.activeWalletEyebrow")}</p>
              <h3 className="headline-md mt-2">{t("dashboard.activeWalletTitle")}</h3>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-4">
            {dashboard.wallets.length === 0 ? (
              <div>
                <EmptyState title={t("dashboard.emptyWalletTitle")} description={t("dashboard.emptyWalletDescription")} />
              </div>
            ) : null}
            {dashboard.wallets.map((wallet, index) => {
              const budgetUsagePercent = wallet.budgetThisMonth > 0 ? Math.min(Math.round((wallet.spentThisMonth / wallet.budgetThisMonth) * 100), 100) : 0;
              const budgetTone = budgetUsagePercent >= 90 ? "text-danger" : budgetUsagePercent >= 70 ? "text-foreground" : "text-primary";
              const budgetPanelClassName =
                budgetUsagePercent >= 90
                  ? "border-[color:var(--danger-border)] bg-[color:var(--danger-soft)]"
                  : budgetUsagePercent >= 70
                    ? "border-[color:rgba(89,95,61,0.2)] bg-[color:color-mix(in_srgb,var(--primary-soft)_40%,var(--muted))]"
                    : "border-[color:var(--soft-border)] bg-muted";
              const budgetBarClassName =
                budgetUsagePercent >= 90
                  ? "bg-[linear-gradient(90deg,var(--danger),#d98989)]"
                  : budgetUsagePercent >= 70
                    ? "bg-[linear-gradient(90deg,var(--primary-strong),var(--primary-soft-strong))]"
                    : "bg-[linear-gradient(90deg,var(--primary),var(--primary-soft-strong))]";
              const budgetTrackClassName = budgetUsagePercent >= 90 ? "bg-white/70 dark:bg-black/20" : "bg-card";

              return (
                <article
                  key={wallet.id}
                  className="wallet-card-enter group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.4rem] border bg-card p-4 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_24px_46px_-28px_rgba(45,54,39,0.34),inset_0_1px_0_rgba(255,255,255,0.42)]"
                  style={{ "--wallet-card-delay": `${index * 70}ms` } as CSSProperties}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(224,231,187,0.9),transparent_58%)] opacity-80 transition duration-200 ease-out group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--soft-border)] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition duration-200 ease-out group-hover:scale-[1.03] group-hover:shadow-[0_12px_24px_-18px_rgba(89,95,61,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]">
                        <AppIcon name="wallet" className="h-5 w-5 transition duration-200 ease-out group-hover:scale-105" tone="primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg">{wallet.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {wallet.kind === "shared" ? t("common.walletKindShared") : t("common.walletKindPersonal")}
                        </p>
                      </div>
                    </div>
                    <Badge>{wallet.role}</Badge>
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border border-[color:var(--soft-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(245,244,237,0.92))] p-4 text-foreground transition duration-200 ease-out group-hover:border-[color:rgba(89,95,61,0.16)] group-hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,244,237,0.98))] dark:bg-[linear-gradient(180deg,rgba(42,51,41,0.96),rgba(32,39,31,0.98))]">
                    <p className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong">{t("dashboard.totalBalanceLabel")}</p>
                    <p className="metric mt-2 text-[1.9rem] leading-none text-foreground sm:text-3xl">{formatCurrency(wallet.totalBalance)}</p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="subtle-panel">
                      <p className="text-sm text-muted-foreground">{t("dashboard.availableBalanceLabel")}</p>
                      <p className="metric mt-2 text-lg">{formatCurrency(wallet.availableBalance)}</p>
                    </div>
                    <div className="subtle-panel">
                      <p className="text-sm text-muted-foreground">{t("dashboard.savingBalanceLabel")}</p>
                      <p className="metric mt-2 text-lg">{formatCurrency(wallet.savingBalance)}</p>
                    </div>
                  </div>

                  <div className={`mt-5 rounded-[1.25rem] border p-4 transition duration-200 ease-out group-hover:border-[color:rgba(89,95,61,0.16)] ${budgetPanelClassName}`}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t("common.members")}</span>
                      <span className="metric text-base">{wallet.members}</span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.budgets")}</p>
                        <p className="metric mt-1 text-base">{formatCurrency(wallet.budgetThisMonth)}</p>
                      </div>
                      <span className={`text-right text-sm ${budgetTone}`}>
                        {wallet.budgetThisMonth > 0
                          ? t("dashboard.walletBudgetUsed", { percent: budgetUsagePercent })
                          : t("dashboard.walletNoBudget")}
                      </span>
                    </div>
                    <div className={`mt-3 h-2.5 rounded-full ${budgetTrackClassName}`}>
                      <div
                        className={`h-2.5 rounded-full transition-[width,filter] duration-200 ease-out group-hover:brightness-105 ${budgetBarClassName}`}
                        style={{ width: `${budgetUsagePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <Button href={`/wallets/${wallet.id}`} variant="soft" className="w-full rounded-full transition duration-200 ease-out group-hover:bg-[var(--primary-soft-strong)]">
                      {t("wallets.openWallet")}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

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
      </section>

      <section className="mt-4 card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{t("dashboard.recentEyebrow")}</p>
            <h3 className="headline-md mt-2">{t("dashboard.recentTitle")}</h3>
          </div>
          <Button href={transactionsHref} variant="ghost">
            {t("common.viewAll")}
          </Button>
        </div>
        <div className="mt-6 space-y-3">
          {dashboard.recentTransactions.length === 0 ? (
            <EmptyState title={t("dashboard.emptyRecentTitle")} description={t("dashboard.emptyRecentDescription")} />
          ) : null}
          {dashboard.recentTransactions.map((transaction) => (
            <div key={transaction.id} className="list-card">
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-card"
                  style={{ borderColor: `${transaction.categoryColor}33`, color: transaction.categoryColor }}
                >
                  <CategoryIcon categoryName={transaction.category} kind={transaction.kind} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{transaction.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{transaction.walletName} / {transaction.category} / {transaction.splitLabel}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className={`metric text-lg ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
                        {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(transaction.date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function BadgeLike({ children }: { children: number }) {
  return <span className="theme-primary-pill inline-flex rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]">{children}</span>;
}
