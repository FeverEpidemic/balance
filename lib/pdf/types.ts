import type { AppLocale } from "@/lib/i18n";

export type ReportPeriodInfo = {
  monthKey: string;
  monthLabel: string;
  generatedAt: string;
};

export type ReportSummary = {
  income: number;
  expense: number;
  net: number;
};

export type ReportMonthlyRow = {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

export type ReportCategoryRow = {
  name: string;
  color: string;
  amount: number;
  share: number;
};

export type ReportPdfData = {
  locale: AppLocale;
  walletName: string;
  period: ReportPeriodInfo;
  summary: ReportSummary;
  monthlyRows: ReportMonthlyRow[];
  categoryRows: ReportCategoryRow[];
};
