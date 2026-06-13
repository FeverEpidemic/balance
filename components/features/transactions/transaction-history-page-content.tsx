"use client";

import { useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { deleteTransaction, updateTransaction } from "@/app/actions/transactions";
import { AppShell } from "@/components/app-shell";
import { ExportExcelButton } from "@/components/features/transactions/export-excel-button";
import { useLocale } from "@/components/providers/locale-provider";
import { useTimezone } from "@/components/providers/timezone-provider";
import { ActionForm } from "@/components/ui/action-form";
import { AppIcon, CategoryIcon } from "@/components/ui/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "@/components/ui/category-select";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TransactionHistoryPageData, TransactionListItem } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, formatShortDate, formatTimeOfDay, toDateInputValue, toTimeInputValue } from "@/lib/utils";

function TransactionKindBadge({ kind, t }: { kind: TransactionListItem["kind"]; t: ReturnType<typeof getTranslator> }) {
  return <Badge tone={kind === "expense" ? "danger" : "success"}>{kind === "expense" ? t("transactions.kindExpense") : t("transactions.kindIncome")}</Badge>;
}

function TransactionMetaBadges({ transaction, t }: { transaction: TransactionListItem; t: ReturnType<typeof getTranslator> }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {transaction.isRecurring ? <Badge>{t("transactions.metaAutomatic")}</Badge> : null}
      {transaction.isSavingLinked ? <Badge>{t("transactions.metaSavings")}</Badge> : null}
      {transaction.isBalanceAdjustment ? <Badge>{t("transactions.metaAdjustment")}</Badge> : null}
    </div>
  );
}

function TransactionEditDialog({
  categories,
  transaction,
  walletId,
  t
}: {
  categories: TransactionHistoryPageData["categories"];
  transaction: TransactionListItem;
  walletId: string;
  t: ReturnType<typeof getTranslator>;
}) {
  const [open, setOpen] = useState(false);
  const timezone = useTimezone();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <span className="inline-flex items-center gap-2">
            <AppIcon name="edit" className="h-4 w-4" tone="primary" />
            <span>{t("transactions.edit")}</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.editTitle")}</DialogTitle>
          <DialogDescription>{t("transactions.editDescription")}</DialogDescription>
        </DialogHeader>
        <ActionForm action={updateTransaction} className="mt-5 grid min-w-0 gap-4" onSuccess={() => setOpen(false)}>
          <input type="hidden" name="wallet_id" value={walletId} />
          <input type="hidden" name="transaction_id" value={transaction.id} />
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.kindLabel")}</span>
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
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.categoryLabel")}</span>
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
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.amountLabel")}</span>
            <CurrencyInput name="amount" defaultValue={transaction.amount} required />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.noteLabel")}</span>
            <input name="note" defaultValue={transaction.note ?? ""} placeholder={t("transactions.notePlaceholder")} />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.dateLabel")}</span>
            <input name="happened_at" type="date" defaultValue={toDateInputValue(transaction.happenedAt)} required />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.timeLabel")}</span>
            <input name="happened_at_time" type="time" defaultValue={toTimeInputValue(transaction.happenedAt, timezone)} />
          </label>
          <SubmitButton pendingText={t("transactions.savePending")} variant="soft">
            {t("transactions.saveChanges")}
          </SubmitButton>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

function TransactionActions({
  canMutate,
  categories,
  transaction,
  walletId,
  t
}: {
  canMutate: boolean;
  categories: TransactionHistoryPageData["categories"];
  transaction: TransactionListItem;
  walletId: string;
  t: ReturnType<typeof getTranslator>;
}) {
  if (transaction.isSavingLinked || !canMutate) {
    return <span className="text-sm text-muted-foreground">{transaction.isSavingLinked ? t("common.savingManaged") : t("common.readOnly")}</span>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      <TransactionEditDialog categories={categories} transaction={transaction} walletId={walletId} t={t} />
      <ActionForm action={deleteTransaction} className="w-full sm:w-auto">
        <input type="hidden" name="wallet_id" value={walletId} />
        <input type="hidden" name="transaction_id" value={transaction.id} />
        <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage={t("transactions.deleteConfirm")} pendingText={t("transactions.deletePending")} variant="ghost">
          {t("transactions.delete")}
        </ConfirmSubmitButton>
      </ActionForm>
    </div>
  );
}

function HistoryMobileCard({
  canMutate,
  categories,
  transaction,
  walletId,
  t
}: {
  canMutate: boolean;
  categories: TransactionHistoryPageData["categories"];
  transaction: TransactionListItem;
  walletId: string;
  t: ReturnType<typeof getTranslator>;
}) {
  const locale = useLocale();
  const timezone = useTimezone();
  return (
    <div className="list-card">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-card"
          style={{ borderColor: `${transaction.categoryColor}33`, color: transaction.categoryColor }}
        >
          <CategoryIcon categoryName={transaction.categoryName} kind={transaction.kind} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{transaction.title}</p>
                {!transaction.isSavingLinked && canMutate ? <Badge>{t("common.editable")}</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{transaction.categoryName} / {transaction.splitLabel}</p>
              <TransactionMetaBadges transaction={transaction} t={t} />
            </div>
            <div className="text-right">
              <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
                {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(transaction.happenedAt, locale, timezone)} • {formatTimeOfDay(transaction.happenedAt, locale, timezone) || "00:00"}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <TransactionKindBadge kind={transaction.kind} t={t} />
          </div>
          <div className="mt-4">
            <TransactionActions canMutate={canMutate} categories={categories} transaction={transaction} walletId={walletId} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransactionHistoryPageContent({ data }: { data: TransactionHistoryPageData }) {
  const locale = useLocale();
  const timezone = useTimezone();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}/transactions`;
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";
  const basePath = `/wallets/${data.walletId}/transactions`;
  const currentSortOption = `${data.sortBy}:${data.sortDirection}`;

  function buildHistoryHref(page: number) {
    const params = new URLSearchParams({
      month: data.selectedMonth,
      view: "history",
      sort: data.sortBy,
      dir: data.sortDirection,
      page: String(page)
    });

    if (data.searchQuery.trim()) {
      params.set("q", data.searchQuery);
    }

    return `${basePath}?${params.toString()}`;
  }

  const columns: ColumnDef<TransactionListItem>[] = [
    {
      accessorKey: "happenedAt",
      header: t("transactions.historyTableDate"),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{formatShortDate(row.original.happenedAt, locale, timezone)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatTimeOfDay(row.original.happenedAt, locale, timezone) || "00:00"}</p>
        </div>
      )
    },
    {
      accessorKey: "title",
      header: t("transactions.historyTableDescription"),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card"
              style={{ borderColor: `${row.original.categoryColor}33`, color: row.original.categoryColor }}
            >
              <CategoryIcon categoryName={row.original.categoryName} kind={row.original.kind} className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{row.original.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{row.original.note || row.original.splitLabel}</p>
            </div>
          </div>
          <TransactionMetaBadges transaction={row.original} t={t} />
        </div>
      )
    },
    {
      accessorKey: "categoryName",
      header: t("transactions.historyTableCategory"),
      cell: ({ row }) => (
        <div>
          <p>{row.original.categoryName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.original.splitLabel}</p>
        </div>
      )
    },
    {
      accessorKey: "kind",
      header: t("transactions.historyTableKind"),
      cell: ({ row }) => <TransactionKindBadge kind={row.original.kind} t={t} />
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">{t("transactions.historyTableAmount")}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <p className={`metric ${row.original.kind === "expense" ? "text-danger" : "text-success"}`}>
            {formatCurrency(row.original.kind === "expense" ? -row.original.amount : row.original.amount)}
          </p>
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("transactions.historyTableActions")}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <TransactionActions
          canMutate={canMutate}
          categories={data.categories}
          transaction={row.original}
          walletId={data.walletId}
          t={t}
        />
      )
    }
  ];

  const table = useReactTable({
    data: data.transactions,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const rows = table.getRowModel().rows;
  const hasActiveSearch = data.searchQuery.trim().length > 0;

  return (
    <AppShell
      currentPath={active}
      title={t("transactions.historyTitle")}
      subtitle={t("transactions.historySubtitle", { walletName: data.walletName })}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      {/* View toggle */}
      <div className="mb-4">
        <div className="glass-panel inline-flex gap-1 rounded-2xl p-1.5">
          <Button
            href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}`}
            variant="ghost"
            className="rounded-xl px-4 py-2 font-label text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {t("transactions.quickInputTab")}
          </Button>
          <Button
            href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}&view=history`}
            variant="soft"
            className="rounded-xl px-4 py-2 font-label text-xs font-semibold uppercase tracking-[0.12em] shadow-none"
          >
            {t("transactions.fullHistoryTab")}
          </Button>
        </div>
      </div>

      <section className="grid gap-4">
        <div className="card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">{t("transactions.historyEyebrow")}</p>
              <h3 className="headline-md mt-2">{t("transactions.historyHeading")}</h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("transactions.historyDescription")}</p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <ExportExcelButton transactions={data.transactions} walletName={data.walletName} selectedMonth={data.selectedMonth} />
              <Button href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}`} variant="ghost" className="w-full sm:w-auto">
                {t("transactions.historyBackToInput")}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <form method="get" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <input type="hidden" name="view" value="history" />
              <input type="hidden" name="page" value="1" />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.historyMonthFilter")}</span>
                <input name="month" type="month" defaultValue={data.selectedMonth} />
              </label>
              <label className="block lg:min-w-[18rem]">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.historySearchLabel")}</span>
                <input name="q" defaultValue={data.searchQuery} placeholder={t("transactions.historySearchPlaceholder")} />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.historySortLabel")}</span>
                <select
                  name="sortOption"
                  defaultValue={currentSortOption}
                  onChange={(event) => {
                    const form = event.currentTarget.form;
                    if (!form) {
                      return;
                    }

                    const [sortBy, sortDirection] = event.currentTarget.value.split(":");
                    const sortInput = form.elements.namedItem("sort");
                    const dirInput = form.elements.namedItem("dir");

                    if (sortInput instanceof HTMLInputElement) {
                      sortInput.value = sortBy;
                    }

                    if (dirInput instanceof HTMLInputElement) {
                      dirInput.value = sortDirection;
                    }
                  }}
                >
                  <option value="happened_at:desc">{t("transactions.historySortDateDesc")}</option>
                  <option value="happened_at:asc">{t("transactions.historySortDateAsc")}</option>
                  <option value="amount:desc">{t("transactions.historySortAmountDesc")}</option>
                  <option value="amount:asc">{t("transactions.historySortAmountAsc")}</option>
                  <option value="category:asc">{t("transactions.historySortCategoryAsc")}</option>
                  <option value="category:desc">{t("transactions.historySortCategoryDesc")}</option>
                  <option value="kind:asc">{t("transactions.historySortKindIncomeFirst")}</option>
                  <option value="kind:desc">{t("transactions.historySortKindExpenseFirst")}</option>
                </select>
              </label>
              <input type="hidden" name="sort" value={data.sortBy} />
              <input type="hidden" name="dir" value={data.sortDirection} />
              <Button variant="soft" className="w-full sm:w-auto">
                {t("common.apply")}
              </Button>
              <Button href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}&view=history`} variant="ghost" className="w-full sm:w-auto">
                {t("common.reset")}
              </Button>
            </form>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{t("transactions.historyMatchCount", { count: data.totalCount, month: data.selectedMonth })}</p>
            <p>{t("transactions.historyPageCount", { page: data.currentPage, total: data.totalPages })}</p>
          </div>

          {data.transactions.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title={hasActiveSearch ? t("transactions.historySearchEmptyTitle") : t("transactions.historyEmptyTitle")}
                description={hasActiveSearch ? t("transactions.historySearchEmptyDescription", { query: data.searchQuery, month: data.selectedMonth }) : t("transactions.historyEmptyDescription")}
              />
            </div>
          ) : (
            <>
              <div className="glass-panel mt-6 hidden overflow-x-auto rounded-[1rem] lg:block">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card backdrop-blur">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={row.original.kind === "expense" ? "bg-[rgba(180,94,94,0.04)]" : "bg-[rgba(91,143,98,0.05)]"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 stack-list lg:hidden">
                {rows.map((row) => (
                  <HistoryMobileCard
                    key={row.original.id}
                    canMutate={canMutate}
                    categories={data.categories}
                    transaction={row.original}
                    walletId={data.walletId}
                    t={t}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{t("transactions.historyShowingCount", { count: rows.length, total: data.totalCount })}</p>
                <div className="flex gap-2">
                  <Button href={data.hasPreviousPage ? buildHistoryHref(data.currentPage - 1) : undefined} variant="ghost" size="sm" disabled={!data.hasPreviousPage}>
                    {t("transactions.historyPrevious")}
                  </Button>
                  <Button href={data.hasNextPage ? buildHistoryHref(data.currentPage + 1) : undefined} variant="soft" size="sm" disabled={!data.hasNextPage}>
                    {t("transactions.historyNext")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}
