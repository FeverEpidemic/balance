"use client";

import { useState, useTransition, useRef, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/app-icon";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { checkPotentialDuplicates, importExcelTransactions } from "@/app/actions/transactions";
import type { CategoryRow } from "@/lib/data/types";

type PreviewTx = {
  tempId: string;
  dateStr: string;
  description: string;
  amount: number;
  kind: "income" | "expense";
  excelCategory: string | null;
  selectedCategoryId: string | "create-new" | null;
  isDuplicate: boolean;
  selected: boolean;
};

export function ImportExcelDialog({
  walletId,
  categories,
  currency = "IDR",
  onSuccess
}: {
  walletId: string;
  categories: CategoryRow[];
  currency?: string;
  onSuccess?: () => void;
}) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<PreviewTx[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setParsedRows([]);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose() {
    setOpen(false);
    resetState();
  }

  function formatExcelDate(d: any): string {
    if (d instanceof Date) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    if (typeof d === "string") {
      const clean = d.trim();
      const matchYMD = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (matchYMD) {
        return `${matchYMD[1]}-${matchYMD[2].padStart(2, "0")}-${matchYMD[3].padStart(2, "0")}`;
      }
      const matchDMY = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (matchDMY) {
        return `${matchDMY[3]}-${matchDMY[2].padStart(2, "0")}-${matchDMY[1].padStart(2, "0")}`;
      }
    }
    if (typeof d === "number") {
      const date = new Date((d - 25569) * 86400 * 1000);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return new Date().toISOString().split("T")[0];
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setErrorMsg(t("transactions.importInvalidFile"));
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);

    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const ab = event.target?.result;
          if (!ab) throw new Error("Could not read file");

          const data = new Uint8Array(ab as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (json.length < 2) {
            setErrorMsg(t("transactions.importParsingError"));
            setIsParsing(false);
            return;
          }

          const headers = json[0].map((h) => String(h).trim().toLowerCase());
          const dateIdx = headers.findIndex((h) => ["tanggal", "date"].includes(h));
          const descIdx = headers.findIndex((h) => ["deskripsi", "description", "note", "catatan"].includes(h));
          const catIdx = headers.findIndex((h) => ["kategori", "category"].includes(h));
          const typeIdx = headers.findIndex((h) => ["jenis", "type", "kind"].includes(h));
          const amountIdx = headers.findIndex((h) => ["jumlah", "amount"].includes(h));

          if (dateIdx === -1 || amountIdx === -1) {
            setErrorMsg(t("transactions.importParsingError"));
            setIsParsing(false);
            return;
          }

          const candidates: PreviewTx[] = [];
          const checkDuplicatesPayload: { happenedAt: string; note: string | null; amount: number; kind: "income" | "expense" }[] = [];

          for (let i = 1; i < json.length; i++) {
            const row = json[i];
            if (!row || row.length === 0 || row[dateIdx] === undefined) continue;

            const rawDate = row[dateIdx];
            const dateStr = formatExcelDate(rawDate);
            const description = descIdx !== -1 && row[descIdx] !== undefined ? String(row[descIdx]).trim() : "";
            const excelCategory = catIdx !== -1 && row[catIdx] !== undefined ? String(row[catIdx]).trim() : "";
            const rawAmount = amountIdx !== -1 ? Number(row[amountIdx]) : 0;
            if (isNaN(rawAmount) || rawAmount === 0) continue;

            let kind: "income" | "expense" = "expense";
            let amount = Math.abs(rawAmount);

            if (rawAmount < 0) {
              kind = "expense";
            } else if (typeIdx !== -1 && row[typeIdx] !== undefined) {
              const typeStr = String(row[typeIdx]).trim().toLowerCase();
              if (["pemasukan", "income", "masuk"].includes(typeStr)) {
                kind = "income";
              } else {
                kind = "expense";
              }
            } else {
              kind = "income";
            }

            let selectedCategoryId: string | "create-new" | null = null;
            if (excelCategory) {
              const matched = categories.find(
                (c) => c.name.toLowerCase() === excelCategory.toLowerCase() && c.kind === kind
              );
              if (matched) {
                selectedCategoryId = matched.id;
              } else {
                selectedCategoryId = "create-new";
              }
            }

            const tempId = `${i}-${dateStr}-${amount}-${description}`;
            candidates.push({
              tempId,
              dateStr,
              description,
              amount,
              kind,
              excelCategory: excelCategory || null,
              selectedCategoryId,
              isDuplicate: false,
              selected: true
            });

            checkDuplicatesPayload.push({
              happenedAt: dateStr,
              note: description || null,
              amount,
              kind
            });
          }

          if (candidates.length === 0) {
            setErrorMsg(t("transactions.importParsingError"));
            setIsParsing(false);
            return;
          }

          const dupResult = await checkPotentialDuplicates(walletId, checkDuplicatesPayload);
          const duplicates = dupResult.success && dupResult.data?.duplicates ? new Set(dupResult.data.duplicates) : new Set<string>();

          const finalRows = candidates.map((c) => {
            const cleanNote = c.description.trim();
            const sig = `${c.dateStr}|${cleanNote}|${c.amount.toFixed(2)}|${c.kind}`;
            const isDuplicate = duplicates.has(sig);
            return {
              ...c,
              isDuplicate,
              selected: !isDuplicate
            };
          });

          setParsedRows(finalRows);
        } catch (err) {
          setErrorMsg(t("transactions.importParsingError"));
        } finally {
          setIsParsing(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setErrorMsg(t("transactions.importParsingError"));
      setIsParsing(false);
    }
  }

  function handleRowCheck(tempId: string, checked: boolean) {
    setParsedRows((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, selected: checked } : row))
    );
  }

  function handleAllCheck(checked: boolean) {
    setParsedRows((prev) => prev.map((row) => ({ ...row, selected: checked })));
  }

  function handleCategoryChange(tempId: string, value: string) {
    setParsedRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId
          ? {
              ...row,
              selectedCategoryId: value === "null" ? null : (value as any)
            }
          : row
      )
    );
  }

  function handleImportSubmit() {
    const selectedRows = parsedRows.filter((row) => row.selected);
    if (selectedRows.length === 0) {
      toast.error(t("transactions.importNoTransactionsSelected"));
      return;
    }

    startTransition(async () => {
      const payload = selectedRows.map((row) => ({
        happenedAt: `${row.dateStr}T12:00:00.000Z`,
        note: row.description || null,
        amount: row.amount,
        kind: row.kind,
        categoryName: row.excelCategory,
        categoryId: row.selectedCategoryId
      }));

      const res = await importExcelTransactions(walletId, payload);
      if (res.status === "success") {
        toast.success(res.message || t("transactions.importSuccess", { count: payload.length }));
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(res.message || t("actionErrors.unexpectedError"));
      }
    });
  }

  const selectedCount = parsedRows.filter((r) => r.selected).length;
  const allChecked = parsedRows.length > 0 && parsedRows.every((r) => r.selected);

  return (
    <>
      <Button type="button" variant="soft" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <span className="inline-flex items-center gap-2">
          <AppIcon name="upload" className="h-4 w-4" tone="primary" />
          <span>{t("transactions.importExcel")}</span>
        </span>
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[min(94vw,56rem)] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-6">
          <DialogHeader className="shrink-0 mb-4">
            <DialogTitle>{t("transactions.importExcelDialogTitle")}</DialogTitle>
            <DialogDescription>{t("transactions.importExcelDialogDescription")}</DialogDescription>
          </DialogHeader>

          {parsedRows.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-10 border-2 border-dashed border-border rounded-2xl bg-muted/20 relative min-h-[250px]">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isParsing}
              />
              <div className="flex flex-col items-center gap-4 text-center p-4">
                {isParsing ? (
                  <>
                    <AppIcon name="refresh" className="h-10 w-10 animate-spin" tone="primary" />
                    <p className="text-sm font-medium">{t("transactions.exportGenerating")}</p>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center">
                      <AppIcon name="upload" className="h-6 w-6" tone="primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t("transactions.importDragDrop")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Mendukung file .xlsx dan .xls</p>
                    </div>
                  </>
                )}
              </div>
              {errorMsg && (
                <div className="mt-4 px-4 py-2 bg-danger-soft text-danger text-xs rounded-lg border border-danger/10">
                  {errorMsg}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("transactions.importPreview")} ({parsedRows.length} baris terdeteksi)
                </h4>
                <Button variant="ghost" size="sm" onClick={resetState} className="text-xs text-muted-foreground hover:text-foreground">
                  Ganti File
                </Button>
              </div>

              <div className="flex-1 overflow-auto border border-border rounded-xl bg-card">
                <div className="hidden md:block min-w-[700px]">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card border-b border-border">
                      <TableRow>
                        <TableHead className="w-12 text-center">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={(e) => handleAllCheck(e.target.checked)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </TableHead>
                        <TableHead className="w-28">{t("transactions.historyTableDate")}</TableHead>
                        <TableHead className="w-48">{t("transactions.historyTableDescription")}</TableHead>
                        <TableHead className="w-24">{t("transactions.historyTableKind")}</TableHead>
                        <TableHead className="w-44">{t("transactions.historyTableCategory")}</TableHead>
                        <TableHead className="w-32 text-right">{t("transactions.historyTableAmount")}</TableHead>
                        <TableHead className="w-32 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row) => {
                        const filteredCategories = categories.filter((c) => c.kind === row.kind);
                        return (
                          <TableRow key={row.tempId} className={row.selected ? "" : "opacity-50"}>
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={(e) => handleRowCheck(row.tempId, e.target.checked)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                            </TableCell>
                            <TableCell className="text-xs font-medium">{row.dateStr}</TableCell>
                            <TableCell className="text-xs max-w-[12rem] truncate" title={row.description || ""}>
                              {row.description || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className="px-2 py-0.5 text-[9px] tracking-wider" tone={row.kind === "expense" ? "danger" : "success"}>
                                {row.kind === "expense" ? t("transactions.kindExpense") : t("transactions.kindIncome")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <select
                                value={row.selectedCategoryId || "null"}
                                onChange={(e) => handleCategoryChange(row.tempId, e.target.value)}
                                className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                              >
                                <option value="null">Uncategorized</option>
                                {row.excelCategory && row.selectedCategoryId === "create-new" && (
                                  <option value="create-new">
                                    {t("transactions.importCreateCategoryOption", { name: row.excelCategory })}
                                  </option>
                                )}
                                {filteredCategories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold">
                              {formatCurrency(row.amount, locale, currency)}
                            </TableCell>
                            <TableCell className="text-center">
                              {row.isDuplicate ? (
                                <Badge tone="danger" className="text-[9px] px-1.5 py-0.5">
                                  {t("transactions.importStatusDuplicate")}
                                </Badge>
                              ) : row.selectedCategoryId === "create-new" ? (
                                <Badge tone="default" className="text-[9px] px-1.5 py-0.5">
                                  {t("transactions.importStatusNewCategory")}
                                </Badge>
                              ) : (
                                <Badge tone="success" className="text-[9px] px-1.5 py-0.5 bg-success-soft/20 text-success border-success/10">
                                  {t("transactions.importStatusOk")}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="block md:hidden p-3 space-y-3">
                  {parsedRows.map((row) => {
                    const filteredCategories = categories.filter((c) => c.kind === row.kind);
                    return (
                      <div
                        key={row.tempId}
                        className={`p-3 border border-border rounded-xl space-y-2 bg-card ${row.selected ? "" : "opacity-50"}`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(e) => handleRowCheck(row.tempId, e.target.checked)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-semibold text-foreground">{row.dateStr}</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <Badge className="px-2 py-0.5 text-[9px] tracking-wider" tone={row.kind === "expense" ? "danger" : "success"}>
                              {row.kind === "expense" ? t("transactions.kindExpense") : t("transactions.kindIncome")}
                            </Badge>
                            {row.isDuplicate ? (
                              <Badge tone="danger" className="text-[9px] px-1.5 py-0.5">
                                {t("transactions.importStatusDuplicate")}
                              </Badge>
                            ) : row.selectedCategoryId === "create-new" ? (
                              <Badge tone="default" className="text-[9px] px-1.5 py-0.5">
                                {t("transactions.importStatusNewCategory")}
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground font-medium">
                          {row.description || "-"}
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-center pt-1 border-t border-muted">
                          <div>
                            <span className="block text-[10px] text-muted-foreground uppercase mb-0.5">Kategori</span>
                            <select
                              value={row.selectedCategoryId || "null"}
                              onChange={(e) => handleCategoryChange(row.tempId, e.target.value)}
                              className="w-full h-8 rounded-lg border border-border bg-card px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            >
                              <option value="null">Uncategorized</option>
                              {row.excelCategory && row.selectedCategoryId === "create-new" && (
                                <option value="create-new">
                                  {t("transactions.importCreateCategoryOption", { name: row.excelCategory })}
                                </option>
                              )}
                              {filteredCategories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                              ))}
                            </select>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] text-muted-foreground uppercase mb-0.5">Jumlah</span>
                            <span className="text-xs font-semibold text-foreground">
                              {formatCurrency(row.amount, locale, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-6 shrink-0 pt-4 border-t border-border">
            <Button variant="ghost" onClick={handleClose} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            {parsedRows.length > 0 && (
              <Button onClick={handleImportSubmit} disabled={isPending || selectedCount === 0} variant="primary">
                {isPending ? t("transactions.importSavePending") : t("transactions.importSave", { count: selectedCount })}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
