"use client";

import { createBalanceAdjustment, createTransaction, deleteTransaction, updateTransaction } from "@/app/actions/transactions";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEditPanel } from "@/components/ui/inline-edit-panel";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TransactionsPageData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, formatShortDate, getTodayDateString, toDateInputValue } from "@/lib/utils";

type TransactionItemProps = {
  canMutate: boolean;
  categories: TransactionsPageData["categories"];
  transaction: TransactionsPageData["transactions"][number];
  walletId: string;
  t: ReturnType<typeof getTranslator>;
};

function TransactionItem({ canMutate, categories, transaction, walletId, t }: TransactionItemProps) {
  return (
    <div className="list-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{transaction.title}</p>
            {transaction.isRecurring ? <Badge>{t("transactions.metaAutomatic")}</Badge> : null}
            {transaction.isSavingLinked ? <Badge>{t("transactions.metaSavings")}</Badge> : null}
            {transaction.isBalanceAdjustment ? <Badge>{t("transactions.metaAdjustment")}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {transaction.categoryName} • {transaction.splitLabel}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
            {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(transaction.happenedAt)}</p>
        </div>
      </div>
      {transaction.isSavingLinked ? (
        <div className="glass-panel mt-4 rounded-xl p-3 text-sm text-muted-foreground">
          {t("transactions.savingLinkedNotice")}
        </div>
      ) : canMutate ? (
        <>
          <ActionForm action={updateTransaction} onSuccess={() => undefined} className="mt-4">
            {({ state }) => (
              <InlineEditPanel
                buttonLabel={t("transactions.editButton")}
                closeSignal={state.status === "success" ? state : null}
                description={t("transactions.editCardDescription")}
                title={t("transactions.editCardTitle")}
              >
                <input type="hidden" name="wallet_id" value={walletId} />
                <input type="hidden" name="transaction_id" value={transaction.id} />
                <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
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
                      <select name="category_id" defaultValue={transaction.categoryId ?? ""}>
                        <option value="">{t("common.noCategory")}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
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
                  <div className="flex min-w-0 flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap">
                    <SubmitButton className="w-full sm:w-auto" pendingText={t("transactions.savePending")} variant="soft">
                      {t("transactions.updateButton")}
                    </SubmitButton>
                  </div>
                </div>
              </InlineEditPanel>
            )}
          </ActionForm>
          <ActionForm action={deleteTransaction} className="mt-2 w-full sm:w-auto">
            <input type="hidden" name="wallet_id" value={walletId} />
            <input type="hidden" name="transaction_id" value={transaction.id} />
            <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage={t("transactions.deleteConfirm")} pendingText={t("transactions.deletePending")} variant="ghost">
              {t("transactions.deleteButton")}
            </ConfirmSubmitButton>
          </ActionForm>
        </>
      ) : null}
    </div>
  );
}

export function TransactionsPageContent({ data }: { data: TransactionsPageData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}/transactions`;
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";

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
    >
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card">
          <p className="eyebrow">{t("transactions.quickInputEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("transactions.quickInputTitle")}</h3>
          <ActionForm action={createTransaction} className="mt-6 grid min-w-0 gap-4" resetOnSuccess>
            <input type="hidden" name="wallet_id" value={data.walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.quickInputKindLabel")}</span>
              <select name="kind" defaultValue="expense">
                <option value="expense">{t("transactions.kindExpense")}</option>
                <option value="income">{t("transactions.kindIncome")}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.amountLabel")}</span>
              <CurrencyInput name="amount" placeholder="Rp0" required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.quickInputCategoryLabel")}</span>
              <select name="category_id" required defaultValue={data.categories[0]?.id ?? ""}>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.noteLabel")}</span>
              <input name="note" placeholder={t("transactions.quickInputNotePlaceholder")} />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.dateLabel")}</span>
              <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
            </label>
            <SubmitButton pendingText={t("transactions.quickInputSavePending")}>{t("transactions.quickInputSave")}</SubmitButton>
          </ActionForm>

          {canMutate ? (
            <div className="mt-8 border-t border-border pt-6">
              <p className="eyebrow">{t("transactions.balanceAdjustmentEyebrow")}</p>
              <h3 className="headline-md mt-2">{t("transactions.balanceAdjustmentTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("transactions.balanceAdjustmentDescription")}
              </p>
              <ActionForm action={createBalanceAdjustment} className="mt-6 grid min-w-0 gap-4" resetOnSuccess>
                <input type="hidden" name="wallet_id" value={data.walletId} />
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.balanceAdjustmentDirectionLabel")}</span>
                  <select name="direction" defaultValue="increase">
                    <option value="increase">{t("transactions.balanceAdjustmentIncrease")}</option>
                    <option value="decrease">{t("transactions.balanceAdjustmentDecrease")}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.balanceAdjustmentAmountLabel")}</span>
                  <CurrencyInput name="amount" placeholder="Rp0" required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.balanceAdjustmentReasonLabel")}</span>
                  <input name="note" placeholder={t("transactions.balanceAdjustmentReasonPlaceholder")} required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.balanceAdjustmentDateLabel")}</span>
                  <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
                </label>
                <SubmitButton pendingText={t("transactions.balanceAdjustmentSavePending")}>{t("transactions.balanceAdjustmentSave")}</SubmitButton>
              </ActionForm>
            </div>
          ) : null}
        </div>

        <div className="card">
          <p className="eyebrow">{t("transactions.recentEyebrow")}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="headline-md">{t("transactions.recentTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("transactions.recentDescription")}</p>
            </div>
            <Button href={`/wallets/${data.walletId}/transactions/history?month=${data.selectedMonth}`} variant="ghost" className="w-full sm:w-auto">
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
              <Button href={`/wallets/${data.walletId}/transactions/history?month=${data.selectedMonth}`} variant="soft" className="w-full sm:w-auto">
                {t("transactions.openHistory")}
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
