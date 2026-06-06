"use client";

import { useDeferredValue, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable
} from "@tanstack/react-table";
import { deleteTransaction, updateTransaction } from "@/app/actions/transactions";
import { AppShell } from "@/components/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TransactionHistoryPageData, TransactionListItem } from "@/lib/data";
import { formatCurrency, formatShortDate, toDateInputValue } from "@/lib/utils";

function matchesTransactionSearch(transaction: TransactionListItem, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    transaction.title,
    transaction.note ?? "",
    transaction.categoryName,
    transaction.kind === "expense" ? "pengeluaran" : "pemasukan",
    transaction.isRecurring ? "otomatis" : "",
    transaction.isSavingLinked ? "tabungan" : "",
    transaction.isBalanceAdjustment ? "penyesuaian" : ""
  ]
    .join(" ")
    .toLocaleLowerCase("id-ID");

  return haystack.includes(search);
}

function TransactionKindBadge({ kind }: { kind: TransactionListItem["kind"] }) {
  return <Badge tone={kind === "expense" ? "danger" : "success"}>{kind === "expense" ? "Pengeluaran" : "Pemasukan"}</Badge>;
}

function TransactionMetaBadges({ transaction }: { transaction: TransactionListItem }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {transaction.isRecurring ? <Badge>Otomatis</Badge> : null}
      {transaction.isSavingLinked ? <Badge>Tabungan</Badge> : null}
      {transaction.isBalanceAdjustment ? <Badge>Penyesuaian</Badge> : null}
    </div>
  );
}

function TransactionEditDialog({
  categories,
  transaction,
  walletId
}: {
  categories: TransactionHistoryPageData["categories"];
  transaction: TransactionListItem;
  walletId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          Ubah
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah transaksi</DialogTitle>
          <DialogDescription>Perbarui jenis, kategori, nominal, catatan, atau tanggal tanpa meninggalkan halaman history.</DialogDescription>
        </DialogHeader>
        <ActionForm action={updateTransaction} className="mt-5 grid min-w-0 gap-4" onSuccess={() => setOpen(false)}>
          <input type="hidden" name="wallet_id" value={walletId} />
          <input type="hidden" name="transaction_id" value={transaction.id} />
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">Jenis</span>
            <select name="kind" defaultValue={transaction.kind}>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </label>
          {transaction.isBalanceAdjustment ? (
            <div className="rounded-xl bg-white/80 p-3 text-sm text-muted-foreground">
              Kategori penyesuaian saldo dikelola otomatis oleh sistem mengikuti arah pemasukan atau pengeluaran.
            </div>
          ) : (
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Kategori</span>
              <select name="category_id" defaultValue={transaction.categoryId ?? ""}>
                <option value="">Tanpa kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">Nominal</span>
            <CurrencyInput name="amount" defaultValue={transaction.amount} required />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">Catatan</span>
            <input name="note" defaultValue={transaction.note ?? ""} placeholder="Opsional" />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">Tanggal transaksi</span>
            <input name="happened_at" type="date" defaultValue={toDateInputValue(transaction.happenedAt)} required />
          </label>
          <SubmitButton pendingText="Menyimpan..." variant="soft">
            Simpan perubahan
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
  walletId
}: {
  canMutate: boolean;
  categories: TransactionHistoryPageData["categories"];
  transaction: TransactionListItem;
  walletId: string;
}) {
  if (transaction.isSavingLinked || !canMutate) {
    return <span className="text-sm text-muted-foreground">{transaction.isSavingLinked ? "Dikelola dari tabungan" : "Read only"}</span>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      <TransactionEditDialog categories={categories} transaction={transaction} walletId={walletId} />
      <ActionForm action={deleteTransaction} className="w-full sm:w-auto">
        <input type="hidden" name="wallet_id" value={walletId} />
        <input type="hidden" name="transaction_id" value={transaction.id} />
        <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage="Hapus transaksi ini?" pendingText="Menghapus..." variant="ghost">
          Hapus
        </ConfirmSubmitButton>
      </ActionForm>
    </div>
  );
}

function HistoryMobileCard({
  canMutate,
  categories,
  transaction,
  walletId
}: {
  canMutate: boolean;
  categories: TransactionHistoryPageData["categories"];
  transaction: TransactionListItem;
  walletId: string;
}) {
  return (
    <div
      className={`list-card ${
        transaction.kind === "expense"
          ? "border border-[rgba(180,94,94,0.08)] bg-[rgba(255,255,255,0.94)]"
          : "border border-[rgba(91,143,98,0.1)] bg-[rgba(255,255,255,0.94)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">{transaction.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {transaction.categoryName} • {transaction.splitLabel}
          </p>
          <TransactionMetaBadges transaction={transaction} />
        </div>
        <div className="text-right">
          <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
            {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(transaction.happenedAt)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TransactionKindBadge kind={transaction.kind} />
      </div>
      <div className="mt-4">
        <TransactionActions canMutate={canMutate} categories={categories} transaction={transaction} walletId={walletId} />
      </div>
    </div>
  );
}

export function TransactionHistoryPageContent({ data }: { data: TransactionHistoryPageData }) {
  const active = `/wallets/${data.walletId}/transactions/history`;
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";
  const [sorting, setSorting] = useState<SortingState>([{ id: "happenedAt", desc: true }]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("id-ID"));
  const filteredTransactions = data.transactions.filter((transaction) => matchesTransactionSearch(transaction, deferredSearch));

  const columns: ColumnDef<TransactionListItem>[] = [
    {
      accessorKey: "happenedAt",
      header: "Tanggal",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{formatShortDate(row.original.happenedAt)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.original.happenedAt.slice(11, 16) || "00:00"}</p>
        </div>
      )
    },
    {
      accessorKey: "title",
      header: "Deskripsi",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium">{row.original.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{row.original.note || row.original.splitLabel}</p>
          <TransactionMetaBadges transaction={row.original} />
        </div>
      )
    },
    {
      accessorKey: "categoryName",
      header: "Kategori",
      cell: ({ row }) => (
        <div>
          <p>{row.original.categoryName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.original.splitLabel}</p>
        </div>
      )
    },
    {
      accessorKey: "kind",
      header: "Jenis",
      cell: ({ row }) => <TransactionKindBadge kind={row.original.kind} />
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Jumlah</div>,
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
      header: () => <div className="text-right">Aksi</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <TransactionActions
          canMutate={canMutate}
          categories={data.categories}
          transaction={row.original}
          walletId={data.walletId}
        />
      )
    }
  ];

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 12
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const rowCount = table.getRowModel().rows.length;

  return (
    <AppShell
      currentPath={active}
      title="Histori transaksi"
      subtitle={`Telusuri transaksi ${data.walletName}`}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <section className="grid gap-4">
        <div className="card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">History</p>
              <h3 className="headline-md mt-2">Riwayat transaksi penuh</h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Urutkan, cari, dan kelola transaksi pada bulan terpilih tanpa membebani halaman input utama.</p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <Button href={`/wallets/${data.walletId}/transactions?month=${data.selectedMonth}`} variant="ghost" className="w-full sm:w-auto">
                Kembali ke input
              </Button>
            </div>
          </div>

          <div className="mt-6 flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <form method="get" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Filter bulan</span>
                <input name="month" type="month" defaultValue={data.selectedMonth} />
              </label>
              <Button variant="soft" className="w-full sm:w-auto">
                Terapkan
              </Button>
              <Button href={`/wallets/${data.walletId}/transactions/history`} variant="ghost" className="w-full sm:w-auto">
                Atur ulang
              </Button>
            </form>
            <label className="block lg:ml-auto lg:min-w-[18rem]">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Cari transaksi bulan ini</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari catatan, kategori, atau jenis" />
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{filteredTransactions.length} transaksi cocok untuk {data.selectedMonth}.</p>
            <p>Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}</p>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="Belum ada transaksi di bulan ini" description="Ubah bulan atau buat transaksi baru dari halaman input jika kamu belum menemukan data yang dicari." />
            </div>
          ) : (
            <>
              <div className="mt-6 hidden overflow-x-auto rounded-[1rem] border border-white/70 bg-white/70 lg:block">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-[rgba(251,249,243,0.94)] backdrop-blur">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 text-left"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {header.column.getIsSorted() === "asc" ? "ASC" : header.column.getIsSorted() === "desc" ? "DESC" : ""}
                                </span>
                              </button>
                            ) : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
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
                {table.getRowModel().rows.map((row) => (
                  <HistoryMobileCard
                    key={row.original.id}
                    canMutate={canMutate}
                    categories={data.categories}
                    transaction={row.original}
                    walletId={data.walletId}
                  />
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {rowCount} transaksi pada halaman ini.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    Sebelumnya
                  </Button>
                  <Button type="button" variant="soft" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Berikutnya
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
