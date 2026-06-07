"use client";

import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  updateRecurringTransaction
} from "@/app/actions/recurring-transactions";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEditPanel } from "@/components/ui/inline-edit-panel";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import type { RecurringTransactionsPageData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, formatShortDate, getTodayDateString } from "@/lib/utils";

function getStatusTone(status: RecurringTransactionsPageData["recurringTransactions"][number]["status"]) {
  if (status === "active") return "success";
  if (status === "ended") return "danger";
  return "default";
}

function getStatusLabel(status: RecurringTransactionsPageData["recurringTransactions"][number]["status"], t: ReturnType<typeof getTranslator>) {
  if (status === "active") return t("recurring.statusActive");
  if (status === "paused") return t("recurring.statusPaused");
  return t("recurring.statusEnded");
}

function RecurringItem({
  canManage,
  categories,
  transaction,
  walletId,
  t
}: {
  canManage: boolean;
  categories: RecurringTransactionsPageData["categories"];
  transaction: RecurringTransactionsPageData["recurringTransactions"][number];
  walletId: string;
  t: ReturnType<typeof getTranslator>;
}) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{transaction.note || (transaction.kind === "income" ? t("recurring.autoIncome") : t("recurring.autoExpense"))}</p>
            <Badge tone={getStatusTone(transaction.status)}>{getStatusLabel(transaction.status, t)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {transaction.categoryName} - {transaction.frequencyLabel}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("recurring.startsAt", { date: formatShortDate(transaction.startDate) })}
            {transaction.endDate ? t("recurring.untilDate", { date: formatShortDate(transaction.endDate) }) : ""}
          </p>
        </div>
        <div className="text-right">
          <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
            {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("recurring.nextRun", { date: transaction.nextRunLabel })}</p>
        </div>
      </div>
      {transaction.lastGeneratedAt ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("recurring.lastGenerated", { date: formatShortDate(transaction.lastGeneratedAt) })}</p>
      ) : null}
      {canManage ? (
        <>
          <ActionForm action={updateRecurringTransaction} className="mt-4">
            {({ state }) => (
              <InlineEditPanel
                buttonLabel={t("recurring.editButton")}
                closeSignal={state.status === "success" ? state : null}
                description={t("recurring.editDescription")}
                title={t("recurring.editTitle")}
              >
                <input type="hidden" name="wallet_id" value={walletId} />
                <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">{t("recurring.kindLabel")}</span>
                    <select name="kind" defaultValue={transaction.kind}>
                      <option value="expense">{t("transactions.kindExpense")}</option>
                      <option value="income">{t("transactions.kindIncome")}</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">{t("recurring.categoryLabel")}</span>
                    <select name="category_id" defaultValue={transaction.categoryId ?? ""}>
                      <option value="">{t("common.noCategory")}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">{t("recurring.amountLabel")}</span>
                    <CurrencyInput name="amount" defaultValue={transaction.amount} required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">{t("recurring.noteLabel")}</span>
                    <input name="note" defaultValue={transaction.note ?? ""} placeholder={t("common.optional")} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">{t("recurring.frequencyLabel")}</span>
                    <select name="frequency" defaultValue={transaction.frequency}>
                      <option value="daily">{t("recurring.frequencyDaily")}</option>
                      <option value="weekly">{t("recurring.frequencyWeekly")}</option>
                      <option value="monthly">{t("recurring.frequencyMonthly")}</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">{t("recurring.intervalLabel")}</span>
                    <input name="interval_count" type="number" min="1" defaultValue={String(transaction.intervalCount)} required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">{t("recurring.startDateLabel")}</span>
                    <input name="start_date" type="date" defaultValue={transaction.startDate} required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">{t("recurring.endDateLabel")}</span>
                    <input name="end_date" type="date" defaultValue={transaction.endDate ?? ""} />
                  </label>
                  <div className="flex min-w-0 flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap">
                    <SubmitButton className="w-full sm:w-auto" pendingText={t("transactions.savePending")} variant="soft">
                      {t("recurring.updateButton")}
                    </SubmitButton>
                  </div>
                </div>
              </InlineEditPanel>
            )}
          </ActionForm>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            {transaction.status === "active" ? (
              <ActionForm action={pauseRecurringTransaction} className="w-full sm:w-auto">
                <input type="hidden" name="wallet_id" value={walletId} />
                <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                <SubmitButton className="w-full sm:w-auto" pendingText={t("recurring.pausePending")} variant="ghost">
                  {t("recurring.pauseButton")}
                </SubmitButton>
              </ActionForm>
            ) : null}
            {transaction.status === "paused" ? (
              <ActionForm action={resumeRecurringTransaction} className="w-full sm:w-auto">
                <input type="hidden" name="wallet_id" value={walletId} />
                <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                <SubmitButton className="w-full sm:w-auto" pendingText={t("recurring.resumePending")} variant="soft">
                  {t("recurring.resumeButton")}
                </SubmitButton>
              </ActionForm>
            ) : null}
            <ActionForm action={deleteRecurringTransaction} className="w-full sm:w-auto">
              <input type="hidden" name="wallet_id" value={walletId} />
              <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
              <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage={t("recurring.deleteConfirm")} pendingText={t("recurring.deletePending")} variant="ghost">
                {t("recurring.deleteButton")}
              </ConfirmSubmitButton>
            </ActionForm>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function RecurringPageContent({ data }: { data: RecurringTransactionsPageData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}/recurring`;
  const canManage = data.currentUserRole === "owner" || data.currentUserRole === "editor";

  return (
    <AppShell
      currentPath={active}
      title={t("recurring.pageTitle")}
      subtitle={t("recurring.pageSubtitle", { walletName: data.walletName })}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card">
          <p className="eyebrow">{t("recurring.newEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("recurring.newTitle")}</h3>
          <div className="mt-4 space-y-3">
            {!canManage ? <Notice>{t("recurring.viewerNotice")}</Notice> : null}
          </div>
          {canManage ? (
            <ActionForm action={createRecurringTransaction} className="mt-6 grid min-w-0 gap-4" resetOnSuccess>
              <input type="hidden" name="wallet_id" value={data.walletId} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("recurring.kindLabel")}</span>
                <select name="kind" defaultValue="expense">
                  <option value="expense">{t("transactions.kindExpense")}</option>
                  <option value="income">{t("transactions.kindIncome")}</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("recurring.amountLabel")}</span>
                <CurrencyInput name="amount" placeholder="Rp0" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("recurring.categoryLabel")}</span>
                <select name="category_id" defaultValue="">
                  <option value="">{t("common.noCategory")}</option>
                  {data.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("recurring.noteLabel")}</span>
                <input name="note" placeholder={t("recurring.notePlaceholder")} />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("recurring.frequencyLabel")}</span>
                <select name="frequency" defaultValue="monthly">
                  <option value="daily">{t("recurring.frequencyDaily")}</option>
                  <option value="weekly">{t("recurring.frequencyWeekly")}</option>
                  <option value="monthly">{t("recurring.frequencyMonthly")}</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("recurring.intervalLabel")}</span>
                <input name="interval_count" type="number" defaultValue="1" min="1" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("recurring.startDateLabel")}</span>
                <input name="start_date" type="date" defaultValue={getTodayDateString()} required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("recurring.endDateLabel")}</span>
                <input name="end_date" type="date" />
              </label>
              <SubmitButton pendingText={t("recurring.savePending")}>{t("recurring.saveButton")}</SubmitButton>
            </ActionForm>
          ) : null}
        </div>

        <div className="card">
          <p className="eyebrow">{t("recurring.activeEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("recurring.activeTitle")}</h3>
          <div className="mt-6 space-y-4">
            {data.recurringTransactions.length === 0 ? (
              <EmptyState title={t("recurring.emptyTitle")} description={t("recurring.emptyDescription")} />
            ) : null}
            {data.recurringTransactions.map((transaction) => (
              <RecurringItem
                key={transaction.id}
                canManage={canManage}
                categories={data.categories}
                transaction={transaction}
                walletId={data.walletId}
                t={t}
              />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
