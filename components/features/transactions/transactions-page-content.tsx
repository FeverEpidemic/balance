"use client";

import { createBalanceAdjustment, deleteTransaction, updateTransaction } from "@/app/actions/transactions";
import { AppShell } from "@/components/app-shell";
import { TransactionCreateDialogButton } from "@/components/features/transactions/transaction-create-dialog-button";
import { TransactionCreateForm } from "@/components/features/transactions/transaction-create-form";
import { useLocale } from "@/components/providers/locale-provider";
import { useTimezone } from "@/components/providers/timezone-provider";
import { AppIcon, CategoryIcon } from "@/components/ui/app-icon";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "@/components/ui/category-select";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEditPanel } from "@/components/ui/inline-edit-panel";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast-provider";
import type { TransactionsPageData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, formatShortDate, formatTimeOfDay, getCurrentTimeString, getTodayDateString, toDateInputValue, toTimeInputValue } from "@/lib/utils";
import { useOptimistic, useCallback, startTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TransactionItemProps = {
  canMutate: boolean;
  categories: TransactionsPageData["categories"];
  transaction: TransactionsPageData["transactions"][number];
  walletId: string;
  t: ReturnType<typeof getTranslator>;
  onDelete: (transactionId: string) => void;
};

function buildTransactionMetaLine(transaction: TransactionsPageData["transactions"][number]) {
  return [transaction.categoryName, transaction.splitLabel && transaction.splitLabel !== "-" ? transaction.splitLabel : null].filter(Boolean).join(" / ");
}

function TransactionItem({ canMutate, categories, transaction, walletId, t, onDelete }: TransactionItemProps) {
  const locale = useLocale();
  const timezone = useTimezone();
  const canEditTransaction = canMutate && !transaction.isSavingLinked;
  const meta = buildTransactionMetaLine(transaction);
  const hasStateBadges = transaction.isRecurring || transaction.isSavingLinked || transaction.isBalanceAdjustment;

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
          {canEditTransaction ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-strong lg:hidden">
              <AppIcon name="edit" className="h-3.5 w-3.5" tone="primary" />
              <span>{t("transactions.editButton")}</span>
            </span>
          ) : null}
        </div>
      </div>

      {canEditTransaction ? (
        <ActionForm action={updateTransaction} onSuccess={() => undefined} className="mt-3">
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
            </InlineEditPanel>
          )}
        </ActionForm>
      ) : null}

      {canEditTransaction ? (
        <ConfirmSubmitButton
          className="min-h-[2.5rem] w-full rounded-lg px-3 text-xs sm:w-auto"
          confirmMessage={t("transactions.deleteConfirm")}
          pendingText={t("transactions.deletePending")}
          variant="ghost"
          onClick={() => onDelete(transaction.id)}
        >
          {t("transactions.deleteButton")}
        </ConfirmSubmitButton>
      ) : null}
    </div>
  );
}

export function TransactionsPageContent({ data }: { data: TransactionsPageData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const router = useRouter();
  const { pushToast } = useToast();
  const active = `/wallets/${data.walletId}/transactions`;
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";
  const createTransactionContext = {
    walletId: data.walletId,
    walletName: data.walletName,
    walletCurrency: data.walletCurrency,
    categories: data.categories
  };

  const [optimisticTransactions, removeOptimisticTransaction] = useOptimistic(
    data.transactions,
    (state, deletedId: string) => state.filter((t) => t.id !== deletedId)
  );

  const deletedTransactionRef = useRef<TransactionsPageData["transactions"][number] | null>(null);

  const handleDelete = useCallback((transactionId: string) => {
    const transaction = data.transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    deletedTransactionRef.current = transaction;

    startTransition(() => {
      removeOptimisticTransaction(transactionId);
    });

    const formData = new FormData();
    formData.set("wallet_id", data.walletId);
    formData.set("transaction_id", transactionId);

    deleteTransaction({ status: "idle" }, formData).then((result) => {
      if (result.status === "error") {
        pushToast({ tone: "error", description: result.message || "Gagal menghapus transaksi" });
        router.refresh();
        return;
      }

      // Show undo toast
      const deletedTx = deletedTransactionRef.current;
      toast.success("Transaksi dihapus", {
        description: "Kamu bisa batalkan dalam 5 detik",
        duration: 5000,
        action: {
          label: "Batalkan",
          onClick: async () => {
            // Re-create the transaction via the create endpoint
            if (!deletedTx) return;
            const createFormData = new FormData();
            createFormData.set("wallet_id", data.walletId);
            createFormData.set("kind", deletedTx.kind);
            createFormData.set("category_id", deletedTx.categoryId || "");
            createFormData.set("note", deletedTx.note || "");
            createFormData.set("amount", String(deletedTx.amount));
            const happenedAtStr = deletedTx.happenedAt.split("T")[0];
            const happenedAtTimeStr = deletedTx.happenedAt.includes("T")
              ? deletedTx.happenedAt.split("T")[1]?.slice(0, 5) || ""
              : "";
            createFormData.set("happened_at", happenedAtStr);
            createFormData.set("happened_at_time", happenedAtTimeStr);

            const { createTransaction } = await import("@/app/actions/transactions");
            const restoreResult = await createTransaction({ status: "idle" }, createFormData);
            if (restoreResult.status === "success") {
              toast.success("Transaksi dikembalikan");
            } else {
              pushToast({ tone: "error", description: restoreResult.message || "Gagal mengembalikan transaksi" });
            }
            router.refresh();
          },
        },
      });

      // Refresh after undo window closes
      setTimeout(() => router.refresh(), 5500);
    });
  }, [data.transactions, data.walletId, removeOptimisticTransaction, pushToast, router]);

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
      {/* View toggle */}
      <div className="mb-4">
        <div className="glass-panel inline-flex gap-1 rounded-2xl p-1.5">
          <Button
            href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}`}
            variant="soft"
            className="rounded-xl px-4 py-2 font-label text-xs font-semibold uppercase tracking-[0.12em] shadow-none"
          >
            {t("transactions.quickInputTab")}
          </Button>
          <Button
            href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}&view=history`}
            variant="ghost"
            className="rounded-xl px-4 py-2 font-label text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {t("transactions.fullHistoryTab")}
          </Button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card">
          <p className="eyebrow">{t("transactions.quickInputEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("transactions.quickInputTitle")}</h3>
          <TransactionCreateForm context={createTransactionContext} className="mt-6 grid min-w-0 gap-4" />

          {canMutate ? (
            <div className="mt-8 border-t border-border pt-6">
              <p className="eyebrow">{t("transactions.balanceAdjustmentEyebrow")}</p>
              <h3 className="headline-md mt-2">{t("transactions.balanceAdjustmentTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("transactions.balanceAdjustmentDescription")}</p>
              <ActionForm action={createBalanceAdjustment} className="mt-6 grid min-w-0 gap-4" resetOnSuccess>
                <input type="hidden" name="wallet_id" value={data.walletId} />
                <div className="glass-panel rounded-2xl p-4">
                  <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {t("transactions.balanceAdjustmentRecordedBalanceLabel")}
                  </p>
                  <p className="metric mt-3 text-xl text-foreground">
                    {formatCurrency(data.currentAvailableBalance, locale, data.walletCurrency)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{t("transactions.balanceAdjustmentAutoDirectionHint")}</p>
                </div>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.balanceAdjustmentActualBalanceLabel")}</span>
                  <CurrencyInput
                    allowNegative
                    name="actual_balance"
                    placeholder="Rp0"
                    required
                    currency={data.walletCurrency}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.balanceAdjustmentReasonLabel")}</span>
                  <input name="note" placeholder={t("transactions.balanceAdjustmentReasonPlaceholder")} required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.balanceAdjustmentDateLabel")}</span>
                  <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.balanceAdjustmentTimeLabel")}</span>
                  <input name="happened_at_time" type="time" defaultValue={getCurrentTimeString()} />
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
            {optimisticTransactions.length === 0 ? (
              <EmptyState title={t("transactions.emptyRecentCardTitle")} description={t("transactions.emptyRecentCardDescription")} />
            ) : null}
            {optimisticTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                canMutate={canMutate}
                categories={data.categories}
                transaction={transaction}
                walletId={data.walletId}
                t={t}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {optimisticTransactions.length > 0 ? (
            <div className="mt-6 flex justify-start">
              <Button href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}&view=history`} variant="soft" className="w-full sm:w-auto">
                {t("transactions.openHistory")}
              </Button>
            </div>
          ) : null}
        </div>
      </section>
      </PullToRefresh>
    </AppShell>
  );
}
