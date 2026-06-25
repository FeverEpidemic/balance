"use client";

import { useState } from "react";
import { updateTransaction } from "@/app/actions/transactions";
import { useTimezone } from "@/components/providers/timezone-provider";
import { ActionForm } from "@/components/ui/action-form";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "@/components/ui/category-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TransactionListItem } from "@/lib/data";
import type { CategoryRow } from "@/lib/data/types";
import { getTranslator } from "@/lib/i18n";
import { toDateInputValue, toTimeInputValue } from "@/lib/utils";

export function TransactionEditDialog({
  categories,
  transaction,
  walletId,
  t
}: {
  categories: CategoryRow[];
  transaction: TransactionListItem;
  walletId: string;
  t: ReturnType<typeof getTranslator>;
}) {
  const [open, setOpen] = useState(false);
  const timezone = useTimezone();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="min-h-[2.35rem] rounded-lg px-3 text-xs">
          <span className="inline-flex items-center gap-2">
            <AppIcon name="edit" className="h-3.5 w-3.5" tone="primary" />
            <span>{t("transactions.edit")}</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.editTitle")}</DialogTitle>
          <DialogDescription>{t("transactions.editDescription")}</DialogDescription>
        </DialogHeader>
        <ActionForm
          key={`edit-tx-${transaction.id}-${open}`}
          action={updateTransaction}
          className="mt-5 grid min-w-0 gap-4"
          onSuccess={() => setOpen(false)}
        >
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
