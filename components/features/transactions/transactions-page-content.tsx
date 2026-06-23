"use client";

import { deleteTransaction, updateTransaction } from "@/app/actions/transactions";
import { AppShell } from "@/components/app-shell";
import { TransactionCreateDialogButton } from "@/components/features/transactions/transaction-create-dialog-button";
import { useLocale } from "@/components/providers/locale-provider";
import { useTimezone } from "@/components/providers/timezone-provider";
import { CategoryIcon } from "@/components/ui/app-icon";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { ActionForm } from "@/components/ui/action-form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "@/components/ui/category-select";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TransactionsPageData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, formatShortDate, formatTimeOfDay, toDateInputValue, toTimeInputValue } from "@/lib/utils";
import { useRef, useState } from "react";

type TransactionItemProps = {
  canMutate: boolean;
  categories: TransactionsPageData["categories"];
  transaction: TransactionsPageData["transactions"][number];
  walletId: string;
  t: ReturnType<typeof getTranslator>;
};

function buildTransactionMetaLine(transaction: TransactionsPageData["transactions"][number]) {
  return [transaction.categoryName, transaction.splitLabel && transaction.splitLabel !== "-" ? transaction.splitLabel : null].filter(Boolean).join(" / ");
}

function TransactionItem({ canMutate, categories, transaction, walletId, t }: TransactionItemProps) {
  const locale = useLocale();
  const timezone = useTimezone();
  const canEditTransaction = canMutate && !transaction.isSavingLinked;
  const meta = buildTransactionMetaLine(transaction);
  const hasStateBadges = transaction.isRecurring || transaction.isSavingLinked || transaction.isBalanceAdjustment;
  const [editOpen, setEditOpen] = useState(false);
  const closeSignalRef = useRef<unknown>(null);

  if (canEditTransaction) {
    return (
      <Collapsible open={editOpen} onOpenChange={setEditOpen} className="list-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card"
                style={{ borderColor: `${transaction.categoryColor}33`, color: transaction.categoryColor }}
              >
                <CategoryIcon categoryName={transaction.categoryName} kind={transaction.kind} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-foreground">{transaction.title}</p>
                  <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]" tone={transaction.kind === "expense" ? "danger" : "success"}>
                    {transaction.kind === "expense" ? t("transactions.kindExpense") : t("transactions.kindIncome")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
                {hasStateBadges ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {transaction.isRecurring ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaAutomatic")}</Badge> : null}
                    {transaction.isSavingLinked ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaSavings")}</Badge> : null}
                    {transaction.isBalanceAdjustment ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaAdjustment")}</Badge> : null}
                  </div>
                ) : null}
                {transaction.isSavingLinked ? <p className="mt-2 text-xs text-muted-foreground">{t("transactions.savingLinkedNotice")}</p> : null}
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 lg:block lg:text-right">
            <div>
              <p className={`metric text-base lg:text-lg ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
                {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatShortDate(transaction.happenedAt, locale, timezone)} • {formatTimeOfDay(transaction.happenedAt, locale, timezone) || "00:00"}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-border" />

        <div className="flex items-center justify-between pt-3">
          <ActionForm action={deleteTransaction}>
            <input type="hidden" name="wallet_id" value={walletId} />
            <input type="hidden" name="transaction_id" value={transaction.id} />
            <ConfirmSubmitButton
              className="min-h-[2.5rem] rounded-lg px-3 font-label text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
              confirmMessage={t("transactions.deleteConfirm")}
              pendingText={t("transactions.deletePending")}
              variant="ghost"
            >
              {t("transactions.deleteButton")}
            </ConfirmSubmitButton>
          </ActionForm>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="soft"
              className="rounded-xl px-4 py-2 font-label text-sm font-medium"
            >
              {editOpen ? t("common.closeEditor") : t("transactions.editButton")}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <ActionForm
            key={`edit-${transaction.id}-${editOpen}`}
            action={updateTransaction}
            onSuccess={() => undefined}
            className="mt-3"
          >
            {({ state }) => {
              // Auto-close on successful save (closeSignal pattern dari InlineEditPanel)
              if (closeSignalRef.current !== state && state.status === "success") {
                closeSignalRef.current = state;
                // Use setTimeout to avoid state update during render
                setTimeout(() => setEditOpen(false), 0);
              }

              return (
                <div className="border-t border-border pt-4">
                  <input type="hidden" name="wallet_id" value={walletId} />
                  <input type="hidden" name="transaction_id" value={transaction.id} />
                  <div className="grid min-w-0 gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.kindLabel")}</span>
                      <select name="kind" defaultValue={transaction.kind}>
                        <option value="expense">{t("transactions.kindExpense")}</option>
                        <option value="income">{t("transactions.kindIncome")}</option>
                      </select>
                    </label>
                    {transaction.isBalanceAdjustment ? (
                      <div className="glass-panel rounded-xl p-3 text-sm text-muted-foreground">
                        {t("transactions.adjustmentCategoryManaged")}
                      </div>
                    ) : (
                      <label className="block">
                        <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.categoryLabel")}</span>
                        <CategorySelect
                          name="category_id"
                          categories={categories}
                          defaultValue={transaction.categoryId ?? ""}
                          includeEmptyOption
                          emptyLabel={t("common.noCategory")}
                        />
                      </label>
                    )}
                    <label className="block">
                      <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.amountLabel")}</span>
                      <CurrencyInput name="amount" defaultValue={transaction.amount} required />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.noteLabel")}</span>
                      <input name="note" defaultValue={transaction.note ?? ""} placeholder={t("transactions.notePlaceholder")} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.dateLabel")}</span>
                      <input name="happened_at" type="date" defaultValue={toDateInputValue(transaction.happenedAt)} required />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-label text-xs text-muted-foreground">{t("transactions.timeLabel")}</span>
                      <input name="happened_at_time" type="time" defaultValue={toTimeInputValue(transaction.happenedAt, timezone)} />
                    </label>
                    <div className="flex min-w-0 flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap">
                      <SubmitButton className="w-full sm:w-auto" pendingText={t("transactions.savePending")} variant="soft">
                        {t("transactions.updateButton")}
                      </SubmitButton>
                    </div>
                  </div>
                </div>
              );
            }}
          </ActionForm>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="list-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card"
              style={{ borderColor: `${transaction.categoryColor}33`, color: transaction.categoryColor }}
            >
              <CategoryIcon categoryName={transaction.categoryName} kind={transaction.kind} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-medium text-foreground">{transaction.title}</p>
                <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]" tone={transaction.kind === "expense" ? "danger" : "success"}>
                  {transaction.kind === "expense" ? t("transactions.kindExpense") : t("transactions.kindIncome")}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
              {hasStateBadges ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {transaction.isRecurring ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaAutomatic")}</Badge> : null}
                  {transaction.isSavingLinked ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaSavings")}</Badge> : null}
                  {transaction.isBalanceAdjustment ? <Badge className="px-2.5 py-0.5 text-[10px] tracking-[0.1em]">{t("transactions.metaAdjustment")}</Badge> : null}
                </div>
              ) : null}
              {transaction.isSavingLinked ? <p className="mt-2 text-xs text-muted-foreground">{t("transactions.savingLinkedNotice")}</p> : null}
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 lg:block lg:text-right">
          <div>
            <p className={`metric text-base lg:text-lg ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
              {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{formatShortDate(transaction.happenedAt, locale, timezone)} • {formatTimeOfDay(transaction.happenedAt, locale, timezone) || "00:00"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransactionsPageContent({ data }: { data: TransactionsPageData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}/transactions`;
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";
  const createTransactionContext = {
    walletId: data.walletId,
    walletName: data.walletName,
    walletCurrency: data.walletCurrency,
    categories: data.categories
  };

  return (
    <AppShell
      currentPath={active}
      title={t("transactions.pageTitle")}
      subtitle={t("transactions.pageSubtitle", { walletName: data.walletName })}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
      fabTransactionContext={canMutate ? createTransactionContext : undefined}
      headerAction={
        canMutate ? (
          <TransactionCreateDialogButton context={createTransactionContext} label={t("dashboard.addTransaction")} />
        ) : null
      }
    >
      <PullToRefresh>
      <section className="card">
        <p className="eyebrow">{t("transactions.recentEyebrow")}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="headline-md">{t("transactions.recentTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("transactions.recentDescription")}</p>
          </div>
          <Button href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}&view=history`} variant="ghost" className="w-full sm:w-auto">
            {t("transactions.viewFullHistory")}
          </Button>
        </div>
        <form method="get" className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.historyMonthFilter")}</span>
            <input name="month" type="month" defaultValue={data.selectedMonth} />
          </label>
          <Button variant="soft" className="w-full sm:w-auto">
            {t("common.apply")}
          </Button>
          <Button href={`/wallets/${data.walletId}/transactions`} variant="ghost" className="w-full sm:w-auto">
            {t("common.reset")}
          </Button>
        </form>
        <div className="mt-6 stack-list">
          {data.transactions.length === 0 ? (
            <EmptyState title={t("transactions.emptyRecentCardTitle")} description={t("transactions.emptyRecentCardDescription")} />
          ) : null}
          {data.transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              canMutate={canMutate}
              categories={data.categories}
              transaction={transaction}
              walletId={data.walletId}
              t={t}
            />
          ))}
        </div>
        {data.transactions.length > 0 ? (
          <div className="mt-6 flex justify-start">
            <Button href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}&view=history`} variant="soft" className="w-full sm:w-auto">
              {t("transactions.openHistory")}
            </Button>
          </div>
        ) : null}
      </section>
      </PullToRefresh>
    </AppShell>
  );
}
