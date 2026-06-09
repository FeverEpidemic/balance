"use client";

import { useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import type { TransactionListItem } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { formatShortDate, toFileSafeSegment } from "@/lib/utils";

export function ExportExcelButton({
  transactions,
  walletName,
  selectedMonth
}: {
  transactions: TransactionListItem[];
  walletName: string;
  selectedMonth: string;
}) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (transactions.length === 0 || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const XLSX = await import("xlsx");
      const rows = transactions.map((transaction) => ({
        [t("transactions.historyTableDate")]: formatShortDate(transaction.happenedAt, locale),
        [t("transactions.historyTableDescription")]: transaction.title,
        [t("transactions.historyTableCategory")]: transaction.categoryName,
        [t("transactions.historyTableKind")]:
          transaction.kind === "expense" ? t("transactions.kindExpense") : t("transactions.kindIncome"),
        [t("transactions.historyTableAmount")]: transaction.kind === "expense" ? -transaction.amount : transaction.amount
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Transactions");
      XLSX.writeFile(workbook, `transactions-${toFileSafeSegment(walletName)}-${selectedMonth}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button type="button" variant="soft" onClick={handleExport} disabled={transactions.length === 0 || isExporting} className="w-full sm:w-auto">
      <span className="inline-flex items-center gap-2">
        <AppIcon name="download" className="h-4 w-4" tone="primary" />
        <span>{isExporting ? t("transactions.exportGenerating") : t("transactions.exportExcel")}</span>
      </span>
    </Button>
  );
}
