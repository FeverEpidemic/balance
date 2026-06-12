"use client";

import { archiveSaving, createSaving, createSavingDeposit, createSavingWithdrawal, updateSaving } from "@/app/actions/savings";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { useTimezone } from "@/components/providers/timezone-provider";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SavingsPageData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, formatShortDate, formatTimeOfDay, getCurrentTimeString, getTodayDateString, toTimeInputValue } from "@/lib/utils";

function SavingCard({
  canMutate,
  data,
  saving,
  t
}: {
  canMutate: boolean;
  data: SavingsPageData;
  saving: SavingsPageData["savings"][number];
  t: ReturnType<typeof getTranslator>;
}) {
  const locale = useLocale();
  const timezone = useTimezone();
  return (
    <article className="rounded-2xl bg-muted p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-xl">{saving.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {saving.isArchived ? t("savings.archived") : saving.progressLabel}
            {saving.targetAmount ? ` • ${t("savings.targetPrefix")} ${formatCurrency(saving.targetAmount, "id", data.walletSummary.currency)}` : ""}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="metric text-2xl">{formatCurrency(saving.currentBalance, "id", data.walletSummary.currency)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("savings.currentBalance")}</p>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-card">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${saving.targetAmount ? saving.progressRatio : 0}%` }} />
      </div>

      {canMutate && !saving.isArchived ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          <ActionForm action={createSavingDeposit} className="glass-panel min-w-0 rounded-xl p-4" resetOnSuccess>
            <input type="hidden" name="wallet_id" value={data.walletId} />
            <input type="hidden" name="saving_id" value={saving.id} />
            <p className="font-medium">{t("savings.depositTitle")}</p>
            <div className="mt-3 grid gap-3">
              <CurrencyInput name="amount" placeholder={t("savings.amountPlaceholder")} required currency={data.walletSummary.currency} />
              {data.walletKind === "shared" ? (
                <select name="member_user_id" defaultValue={data.memberOptions[0]?.userId ?? ""} required>
                  {data.memberOptions.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <input name="note" placeholder={t("savings.notePlaceholder")} />
              <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
              <input name="happened_at_time" type="time" defaultValue={getCurrentTimeString()} />
              <SubmitButton className="w-full" pendingText={t("transactions.savePending")}>
                {t("savings.depositSave")}
              </SubmitButton>
            </div>
          </ActionForm>

          <ActionForm action={createSavingWithdrawal} className="glass-panel min-w-0 rounded-xl p-4" resetOnSuccess>
            <input type="hidden" name="wallet_id" value={data.walletId} />
            <input type="hidden" name="saving_id" value={saving.id} />
            <p className="font-medium">{t("savings.withdrawTitle")}</p>
            <div className="mt-3 grid gap-3">
              <CurrencyInput name="amount" placeholder={t("savings.amountPlaceholder")} required currency={data.walletSummary.currency} />
              <input name="note" placeholder={t("savings.notePlaceholder")} />
              <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
              <input name="happened_at_time" type="time" defaultValue={getCurrentTimeString()} />
              <SubmitButton className="w-full" pendingText={t("transactions.savePending")}>
                {t("savings.withdrawSave")}
              </SubmitButton>
            </div>
          </ActionForm>

          <div className="glass-panel min-w-0 rounded-xl p-4 lg:col-span-2 2xl:col-span-1">
            <p className="font-medium">{t("savings.manageTitle")}</p>
            <ActionForm action={updateSaving} className="mt-3 grid gap-3">
              <input type="hidden" name="wallet_id" value={data.walletId} />
              <input type="hidden" name="saving_id" value={saving.id} />
              <input name="name" defaultValue={saving.name} required />
              <CurrencyInput name="target_amount" defaultValue={saving.targetAmount} placeholder={t("savings.targetPlaceholder")} currency={data.walletSummary.currency} />
              <SubmitButton className="w-full" pendingText={t("transactions.savePending")} variant="soft">
                {t("savings.updateButton")}
              </SubmitButton>
            </ActionForm>
            <ActionForm action={archiveSaving} className="mt-3">
              <input type="hidden" name="wallet_id" value={data.walletId} />
              <input type="hidden" name="saving_id" value={saving.id} />
              <ConfirmSubmitButton
                className="w-full"
                confirmMessage={t("savings.archiveConfirm")}
                pendingText={t("savings.archivePending")}
                variant="ghost"
              >
                {t("savings.archiveButton")}
              </ConfirmSubmitButton>
            </ActionForm>
          </div>
        </div>
      ) : null}

      {data.walletKind === "shared" ? (
        <div className="glass-panel mt-4 rounded-xl p-4">
          <p className="font-medium">{t("savings.contributionTitle")}</p>
          <div className="mt-3 space-y-2">
            {saving.contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("savings.contributionEmpty")}</p>
            ) : (
              saving.contributions.map((contribution) => (
                <div key={contribution.memberUserId} className="flex items-center justify-between gap-3 text-sm">
                  <span>{contribution.memberName}</span>
                  <span className="metric">{formatCurrency(contribution.totalContributed, "id", data.walletSummary.currency)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="glass-panel mt-4 rounded-xl p-4">
        <p className="font-medium">{t("savings.historyTitle")}</p>
        <div className="mt-3 space-y-3">
          {saving.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("savings.historyEmpty")}</p>
          ) : (
            saving.entries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-2 rounded-xl bg-muted p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{entry.type === "deposit" ? t("savings.depositTitle") : t("savings.withdrawTitle")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.note || t("savings.noNote")}
                    {entry.memberName ? ` • ${entry.memberName}` : ""}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className={`metric ${entry.type === "deposit" ? "text-success" : "text-danger"}`}>
                    {formatCurrency(entry.type === "deposit" ? entry.amount : -entry.amount, "id", data.walletSummary.currency)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(entry.happenedAt, locale, timezone)} • {formatTimeOfDay(entry.happenedAt, locale, timezone) || "00:00"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

export function SavingsPageContent({ data }: { data: SavingsPageData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}/savings`;
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";

  return (
    <AppShell
      currentPath={active}
      title={t("savings.pageTitle")}
      subtitle={t("savings.pageSubtitle", { walletName: data.walletName })}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-muted-foreground">{t("savings.availableBalance")}</p>
          <p className="metric mt-2 text-2xl">{formatCurrency(data.walletSummary.availableBalance, "id", data.walletSummary.currency)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">{t("savings.savingBalance")}</p>
          <p className="metric mt-2 text-2xl">{formatCurrency(data.walletSummary.savingBalance, "id", data.walletSummary.currency)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">{t("savings.totalBalance")}</p>
          <p className="metric mt-2 text-2xl">{formatCurrency(data.walletSummary.totalBalance, "id", data.walletSummary.currency)}</p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)]">
        <div className="card min-w-0">
          <p className="eyebrow">{t("savings.newEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("savings.newTitle")}</h3>
          <div className="mt-4 space-y-3">
            {!canMutate ? <Notice tone="info">{t("savings.viewerNotice")}</Notice> : null}
          </div>
          {canMutate ? (
            <ActionForm action={createSaving} className="mt-6 grid gap-4" resetOnSuccess>
              <input type="hidden" name="wallet_id" value={data.walletId} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("savings.nameLabel")}</span>
                <input name="name" placeholder={t("savings.namePlaceholder")} required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("savings.targetLabel")}</span>
                <CurrencyInput name="target_amount" placeholder={t("savings.targetPlaceholder")} currency={data.walletSummary.currency} />
              </label>
              <SubmitButton pendingText={t("savings.createPending")}>{t("savings.createButton")}</SubmitButton>
            </ActionForm>
          ) : null}
        </div>

        <div className="card min-w-0">
          <p className="eyebrow">{t("savings.listEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("savings.listTitle")}</h3>
          <div className="mt-6 space-y-4">
            {data.savings.length === 0 ? (
              <EmptyState title={t("savings.emptyTitle")} description={t("savings.emptyDescription")} />
            ) : null}
            {data.savings.map((saving) => (
              <SavingCard key={saving.id} canMutate={canMutate} data={data} saving={saving} t={t} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
