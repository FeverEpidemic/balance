"use client";

import { createTransaction } from "@/app/actions/transactions";
import { useLocale } from "@/components/providers/locale-provider";
import { ActionForm } from "@/components/ui/action-form";
import { CategorySelect } from "@/components/ui/category-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TransactionCreateContext } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, getCurrentTimeString, getTodayDateString } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type TransactionCreateFormProps = {
  context: TransactionCreateContext;
  onSuccess?: () => void;
} & Omit<ComponentPropsWithoutRef<typeof ActionForm>, "action" | "children" | "onSuccess" | "resetOnSuccess">;

export function TransactionCreateForm({
  className,
  context,
  onSuccess,
  ...props
}: TransactionCreateFormProps) {
  const locale = useLocale();
  const t = getTranslator(locale);

  return (
    <ActionForm action={createTransaction} className={className} onSuccess={onSuccess} resetOnSuccess {...props}>
      <input type="hidden" name="wallet_id" value={context.walletId} />
      <label className="block">
        <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.quickInputKindLabel")}</span>
        <select name="kind" defaultValue="expense">
          <option value="expense">{t("transactions.kindExpense")}</option>
          <option value="income">{t("transactions.kindIncome")}</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.amountLabel")}</span>
        <CurrencyInput
          currency={context.walletCurrency}
          name="amount"
          placeholder={formatCurrency(0, locale, context.walletCurrency)}
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.quickInputCategoryLabel")}</span>
        <CategorySelect
          name="category_id"
          categories={context.categories}
          defaultValue={context.categories[0]?.id ?? ""}
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.noteLabel")}</span>
        <input name="note" placeholder={t("transactions.quickInputNotePlaceholder")} />
      </label>
      <label className="block">
        <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.dateLabel")}</span>
        <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
      </label>
      <label className="block">
        <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.timeLabel")}</span>
        <input name="happened_at_time" type="time" defaultValue={getCurrentTimeString()} />
      </label>
      <SubmitButton pendingText={t("transactions.quickInputSavePending")}>{t("transactions.quickInputSave")}</SubmitButton>
    </ActionForm>
  );
}
