"use client";

import { createBatchTransactions } from "@/app/actions/transactions";
import { useLocale } from "@/components/providers/locale-provider";
import { ActionForm } from "@/components/ui/action-form";
import { CategorySelect } from "@/components/ui/category-select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { ScanReceiptButton } from "@/components/features/transactions/scan-receipt-button";
import type { TransactionCreateContext } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency, getCurrentTimeString, getTodayDateString } from "@/lib/utils";
import { useState, useCallback, type ComponentPropsWithoutRef } from "react";
import type { OcrTransactionResult } from "@/lib/ai/ocr-prompt";

type TransactionCreateFormProps = {
  context: TransactionCreateContext;
  onSuccess?: () => void;
} & Omit<ComponentPropsWithoutRef<typeof ActionForm>, "action" | "children" | "onSuccess" | "resetOnSuccess">;

type RowData = {
  id: number;
};

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
  const [rows, setRows] = useState<RowData[]>([{ id: 0 }]);
  const [rowCounter, setRowCounter] = useState(1);

  function handleScanComplete(result: OcrTransactionResult) {
    setScanResult(result);
    setShowScanConfirmation(true);
  }

  function applyScanResult() {
    if (!scanResult) return;

    const form = document.querySelector<HTMLFormElement>("#transaction-create-form");
    if (!form) return;
    const kindSelect = form.querySelector<HTMLSelectElement>("select[name='kind_0']");
    const noteInput = form.querySelector<HTMLInputElement>("input[name='note_0']");
    const dateInput = form.querySelector<HTMLInputElement>("input[name='happened_at_0']");
    const categorySelect = form.querySelector<HTMLSelectElement>("select[name='category_id_0']");

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
    setRows([{ id: 0 }]);
    setRowCounter(1);
    onSuccess?.();
  }

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { id: rowCounter }]);
    setRowCounter((prev) => prev + 1);
  }, [rowCounter]);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  }, []);

  const isBatch = rows.length > 1;

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

      <ActionForm action={createBatchTransactions} className={className} onSuccess={handleFormSuccess} resetOnSuccess id="transaction-create-form" {...props}>
        <input type="hidden" name="wallet_id" value={context.walletId} />
        <input type="hidden" name="row_count" value={rows.length} />

        <div className="space-y-6">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={`rounded-lg border p-4 ${isBatch ? "border-primary/20 bg-primary/[0.02]" : "border-transparent p-0"}`}
            >
              {isBatch && (
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-label text-xs text-muted-foreground">
                    Transaksi #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-xs text-danger hover:text-danger/80"
                  >
                    ✕ Hapus
                  </button>
                </div>
              )}

              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.quickInputKindLabel")}</span>
                  <select name={`kind_${index}`} defaultValue="expense">
                    <option value="expense">{t("transactions.kindExpense")}</option>
                    <option value="income">{t("transactions.kindIncome")}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.amountLabel")}</span>
                  <CurrencyInput
                    currency={context.walletCurrency}
                    name={`amount_${index}`}
                    placeholder={formatCurrency(0, locale, context.walletCurrency)}
                    required
                    defaultValue={index === 0 ? scanAmountDefault : null}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.quickInputCategoryLabel")}</span>
                  <CategorySelect
                    name={`category_id_${index}`}
                    categories={context.categories}
                    defaultValue={context.categories[0]?.id ?? ""}
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.noteLabel")}</span>
                  <input name={`note_${index}`} placeholder={t("transactions.quickInputNotePlaceholder")} />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.dateLabel")}</span>
                  <input name={`happened_at_${index}`} type="date" defaultValue={getTodayDateString()} required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">{t("transactions.timeLabel")}</span>
                  <input name={`happened_at_time_${index}`} type="time" defaultValue={getCurrentTimeString()} />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={addRow} className="gap-2 self-start">
            + {t("transactions.addRowButton")}
          </Button>
          <div className="flex gap-2">
            {isBatch && (
              <span className="self-center text-xs text-muted-foreground">
                {rows.length} transaksi
              </span>
            )}
            <SubmitButton pendingText={t("transactions.quickInputSavePending")}>
              {isBatch
                ? t("transactions.batchSave", { count: rows.length })
                : t("transactions.quickInputSave")}
            </SubmitButton>
          </div>
        </div>
      </ActionForm>
    </>
  );
}
