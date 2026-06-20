"use client";

import { createTransaction } from "@/app/actions/transactions";
import { useLocale } from "@/components/providers/locale-provider";
import { ActionForm } from "@/components/ui/action-form";
import { CategorySelect } from "@/components/ui/category-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ScanReceiptButton } from "@/components/features/transactions/scan-receipt-button";
import type { TransactionCreateContext } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, getCurrentTimeString, getTodayDateString } from "@/lib/utils";
import { useState, type ComponentPropsWithoutRef } from "react";
import type { OcrTransactionResult } from "@/lib/ai/ocr-prompt";

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
  const [scanResult, setScanResult] = useState<OcrTransactionResult | null>(null);
  const [showScanConfirmation, setShowScanConfirmation] = useState(false);
  const [scanAmountDefault, setScanAmountDefault] = useState<number | null>(null);

  function handleScanComplete(result: OcrTransactionResult) {
    setScanResult(result);
    setShowScanConfirmation(true);
  }

  function applyScanResult() {
    if (!scanResult) return;

    const form = document.querySelector<HTMLFormElement>("#transaction-create-form");
    if (!form) return;
    const kindSelect = form.querySelector<HTMLSelectElement>("select[name='kind']");
    const noteInput = form.querySelector<HTMLInputElement>("input[name='note']");
    const dateInput = form.querySelector<HTMLInputElement>("input[name='happened_at']");
    const categorySelect = form.querySelector<HTMLSelectElement>("select[name='category_id']");

    // CurrencyInput is a React-controlled component — use state instead of DOM manipulation
    setScanAmountDefault(scanResult.amount);

    if (kindSelect) kindSelect.value = scanResult.kind;
    if (noteInput) noteInput.value = scanResult.note;
    if (dateInput && scanResult.date) dateInput.value = scanResult.date;

    if (categorySelect) {
      const canonical = scanResult.category;
      for (let i = 0; i < categorySelect.options.length; i++) {
        const optText = categorySelect.options[i].text.trim().toLowerCase();
        if (optText === canonical.toLowerCase()) {
          categorySelect.value = categorySelect.options[i].value;
          break;
        }
      }
    }

    setScanResult(null);
    setShowScanConfirmation(false);
  }

  function dismissScanResult() {
    setScanResult(null);
    setScanAmountDefault(null);
    setShowScanConfirmation(false);
  }

  function handleFormSuccess() {
    setScanAmountDefault(null);
    onSuccess?.();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ScanReceiptButton onScanComplete={handleScanComplete} />

        {showScanConfirmation && scanResult && (
          <div className="flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-sm text-on-primary-container dark:bg-primary-container/20">
            <span>
              Rp{scanResult.amount.toLocaleString("id-ID")}
              {scanResult.merchant ? ` — ${scanResult.merchant}` : ""}
              {" • "}
              {scanResult.category}
            </span>
            <button
              type="button"
              onClick={applyScanResult}
              className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary hover:opacity-90"
            >
              Pakai
            </button>
            <button
              type="button"
              onClick={dismissScanResult}
              className="ml-1 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <ActionForm action={createTransaction} className={className} onSuccess={handleFormSuccess} resetOnSuccess id="transaction-create-form" {...props}>
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
            defaultValue={scanAmountDefault}
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
    </>
  );
}
