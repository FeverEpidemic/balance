"use client";

import { createWallet } from "@/app/actions/wallets";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import type { DashboardData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export function WalletsPageContent({
  dashboard,
  feedback
}: {
  dashboard: DashboardData;
  feedback: { error?: string; message?: string };
}) {
  const locale = useLocale();
  const t = getTranslator(locale);

  return (
    <AppShell
      currentPath="/wallets"
      title={t("wallets.pageTitle")}
      subtitle={t("wallets.pageSubtitle")}
      userName={dashboard.shell.userName}
      walletCount={dashboard.shell.walletCount}
      budgetCount={dashboard.shell.budgetCount}
      memberCount={dashboard.shell.memberCount}
      primaryWalletId={dashboard.shell.primaryWalletId}
    >
      <ToastFeedback error={feedback.error} message={feedback.message} />
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

      <section className="wallet-grid">
        {dashboard.wallets.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title={t("wallets.emptyTitle")}
              description={t("wallets.emptyDescription")}
            />
          </div>
        ) : null}
        {dashboard.wallets.map((wallet) => (
          <article key={wallet.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl">{wallet.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{wallet.kind === "shared" ? t("common.walletKindShared") : t("common.walletKindPersonal")}</p>
              </div>
              <Badge>{wallet.role}</Badge>
            </div>
            <p className="metric mt-6 text-3xl">{formatCurrency(wallet.totalBalance)}</p>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div className="info-tile">
                <p className="text-muted-foreground">{t("wallets.availableBalance")}</p>
                <p className="metric mt-2">{formatCurrency(wallet.availableBalance)}</p>
              </div>
              <div className="info-tile">
                <p className="text-muted-foreground">{t("wallets.savingBalance")}</p>
                <p className="metric mt-2">{formatCurrency(wallet.savingBalance)}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div className="info-tile">
                <p className="text-muted-foreground">{t("wallets.usedAmount")}</p>
                <p className="metric mt-2">{formatCurrency(wallet.spentThisMonth)}</p>
              </div>
              <div className="info-tile">
                <p className="text-muted-foreground">{t("wallets.budgetAmount")}</p>
                <p className="metric mt-2">{formatCurrency(wallet.budgetThisMonth)}</p>
              </div>
              <div className="info-tile">
                <p className="text-muted-foreground">{t("wallets.membersCount")}</p>
                <p className="metric mt-2">{wallet.members}</p>
              </div>
            </div>
            <div className="mt-6">
              <Button href={`/wallets/${wallet.id}`} className="w-full">
                {t("wallets.openWallet")}
              </Button>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
