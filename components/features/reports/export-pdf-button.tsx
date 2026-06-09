"use client";

import { useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n";

export function ExportPdfButton({ walletId }: { walletId: string }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch(`/api/reports/${walletId}/pdf?locale=${locale}`);
      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok || !contentType.includes("application/pdf")) {
        throw new Error("pdf-export-failed");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename="([^"]+)"/i);
      const fileName = fileNameMatch?.[1] ?? `report-${walletId}.pdf`;
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      window.alert(t("reports.exportPdfError"));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button type="button" variant="soft" onClick={handleExport} disabled={isExporting} className="min-h-[2.75rem] rounded-full px-3 shadow-none hover:shadow-none">
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card ring-1 ring-inset ring-border">
          <AppIcon name="download" className="h-4 w-4" tone="primary" />
        </span>
        <span className="hidden sm:inline">{isExporting ? t("reports.exportPdfGenerating") : t("reports.exportPdf")}</span>
        <span className="sr-only sm:hidden">{isExporting ? t("reports.exportPdfGenerating") : t("reports.exportPdf")}</span>
      </span>
    </Button>
  );
}
