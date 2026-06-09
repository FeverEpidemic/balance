import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { getTranslator } from "@/lib/i18n";
import type { ReportCategoryRow, ReportPdfData } from "@/lib/pdf/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 42,
    paddingHorizontal: 34,
    backgroundColor: "#f6f3ea",
    color: "#1f241b",
    fontSize: 10,
    fontFamily: "Helvetica"
  },
  header: {
    marginBottom: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#ffffff"
  },
  eyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#6f7566",
    marginBottom: 6
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#40482f"
  },
  subtitle: {
    marginTop: 6,
    fontSize: 11,
    color: "#5a6051"
  },
  summaryGrid: {
    flexDirection: "row",
    marginBottom: 18
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff"
  },
  summaryLabel: {
    fontSize: 9,
    color: "#72786b",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: "Helvetica-Bold"
  },
  summaryIncome: {
    color: "#47624c"
  },
  summaryExpense: {
    color: "#8c544c"
  },
  summaryNet: {
    color: "#40482f"
  },
  section: {
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff"
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#40482f"
  },
  sectionMeta: {
    marginTop: 4,
    fontSize: 10,
    color: "#6f7566"
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ded9cc"
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#efeadf"
  },
  colMonth: {
    flex: 1.1
  },
  colValue: {
    flex: 1,
    textAlign: "right"
  },
  tableHeaderText: {
    fontSize: 9,
    color: "#72786b",
    textTransform: "uppercase",
    letterSpacing: 0.7
  },
  tableCellText: {
    fontSize: 10,
    color: "#2f3529"
  },
  tableCellStrong: {
    fontFamily: "Helvetica-Bold"
  },
  categoryRow: {
    marginTop: 12
  },
  categoryTop: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  categoryName: {
    fontSize: 10,
    color: "#2f3529"
  },
  categoryMeta: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#40482f"
  },
  barTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#ece6d9"
  },
  barFill: {
    height: 8,
    borderRadius: 999
  },
  emptyHint: {
    marginTop: 12,
    fontSize: 10,
    color: "#72786b"
  },
  footer: {
    marginTop: 18,
    fontSize: 9,
    color: "#72786b",
    textAlign: "right"
  }
});

function CategoryBreakdown({ row, locale }: { row: ReportCategoryRow; locale: ReportPdfData["locale"] }) {
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryTop}>
        <Text style={styles.categoryName}>{row.name}</Text>
        <Text style={styles.categoryMeta}>
          {formatCurrency(-row.amount, locale)} ({Math.round(row.share * 100)}%)
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(row.share * 100, row.share > 0 ? 6 : 0)}%`, backgroundColor: row.color }]} />
      </View>
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportPdfData }) {
  const t = getTranslator(data.locale);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{data.walletName}</Text>
          <Text style={styles.title}>{t("reports.pdfMonthlyTitle")}</Text>
          <Text style={styles.subtitle}>
            {data.period.monthLabel} • {t("reports.pdfGeneratedAt")}: {formatDateTime(data.period.generatedAt, data.locale, { dateStyle: "medium", timeStyle: "short" })}
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { marginRight: 12 }]}>
            <Text style={styles.summaryLabel}>{t("reports.pdfSummaryIncome")}</Text>
            <Text style={[styles.summaryValue, styles.summaryIncome]}>{formatCurrency(data.summary.income, data.locale)}</Text>
          </View>
          <View style={[styles.summaryCard, { marginRight: 12 }]}>
            <Text style={styles.summaryLabel}>{t("reports.pdfSummaryExpense")}</Text>
            <Text style={[styles.summaryValue, styles.summaryExpense]}>{formatCurrency(-data.summary.expense, data.locale)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel]}>{t("reports.pdfSummaryNet")}</Text>
            <Text style={[styles.summaryValue, styles.summaryNet]}>{formatCurrency(data.summary.net, data.locale)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("reports.pdfMonthlyTitle")}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colMonth]}>{t("reports.pdfMonthlyColMonth")}</Text>
            <Text style={[styles.tableHeaderText, styles.colValue]}>{t("reports.pdfMonthlyColIncome")}</Text>
            <Text style={[styles.tableHeaderText, styles.colValue]}>{t("reports.pdfMonthlyColExpense")}</Text>
            <Text style={[styles.tableHeaderText, styles.colValue]}>{t("reports.pdfMonthlyColNet")}</Text>
          </View>
          {data.monthlyRows.map((row) => (
            <View key={row.month} style={styles.tableRow}>
              <Text style={[styles.tableCellText, styles.colMonth]}>{row.label}</Text>
              <Text style={[styles.tableCellText, styles.colValue]}>{formatCurrency(row.income, data.locale)}</Text>
              <Text style={[styles.tableCellText, styles.colValue]}>{formatCurrency(-row.expense, data.locale)}</Text>
              <Text style={[styles.tableCellText, styles.tableCellStrong, styles.colValue]}>{formatCurrency(row.net, data.locale)}</Text>
            </View>
          ))}
          {data.monthlyRows.length === 0 ? <Text style={styles.emptyHint}>{t("reports.emptyDescription")}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("reports.pdfCategoryTitle")}</Text>
          <Text style={styles.sectionMeta}>{data.period.monthLabel}</Text>
          {data.categoryRows.length > 0 ? data.categoryRows.map((row) => <CategoryBreakdown key={row.name} row={row} locale={data.locale} />) : <Text style={styles.emptyHint}>{t("reports.emptyDescription")}</Text>}
        </View>

        <Text style={styles.footer}>{t("reports.pageSubtitle", { walletName: data.walletName })}</Text>
      </Page>
    </Document>
  );
}
