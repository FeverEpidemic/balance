import type { AiCategoryFocus, AiFinancialRecap } from "@/lib/ai/data";
import { buildDirectRecapMessage } from "@/lib/ai/recap-message";
import { formatCurrency } from "@/lib/utils";

const LOW_SIGNAL_PATTERNS = [
  /sama-sama/i,
  /kalau ada yang mau ditanya/i,
  /bilang aja/i,
  /mau ditanya lebih detail/i,
  /lihat saldo akhir/i
];

function buildSavingsSuggestion(recap: AiFinancialRecap, categoryFocus: AiCategoryFocus | null) {
  const topCategory = categoryFocus
    ? {
        categoryName: categoryFocus.categoryName,
        total: categoryFocus.totalExpense
      }
    : recap.topExpenseCategories[0];

  if (!topCategory) {
    return [
      "Data pengeluaran di periode aktif masih terlalu tipis untuk menunjuk area hemat yang paling jelas.",
      `Sejauh ini arus kas kamu ada di net ${formatCurrency(recap.net)} dari ${recap.transactionCount} transaksi, jadi langkah paling aman adalah tambah beberapa transaksi rutin dulu supaya polanya lebih terbaca.`
    ].join(" ");
  }

  return [
    `Area hemat yang paling realistis saat ini ada di kategori ${topCategory.categoryName}, karena nilainya paling besar yaitu ${formatCurrency(topCategory.total)}.`,
    `Total pengeluaran periode aktif sekarang ${formatCurrency(recap.totalExpense)} dengan net ${formatCurrency(recap.net)}, jadi menahan kategori itu dulu biasanya paling cepat terasa dampaknya.`
  ].join(" ");
}

function buildAnalysisResponse(recap: AiFinancialRecap, categoryFocus: AiCategoryFocus | null) {
  const topCategory = categoryFocus
    ? {
        categoryName: categoryFocus.categoryName,
        total: categoryFocus.totalExpense
      }
    : recap.topExpenseCategories[0];
  const busiestWallet = recap.perWallet[0];

  if (recap.transactionCount === 0) {
    return "Belum ada transaksi di periode aktif, jadi saya belum bisa membaca pola pengeluaran yang berarti. Begitu ada beberapa transaksi masuk, saya bisa bantu lihat kategori paling berat dan ritme cashflow-nya.";
  }

  const lines = [
    `Dari ${recap.transactionCount} transaksi di periode aktif, total pengeluaran kamu ${formatCurrency(recap.totalExpense)} dan net saat ini ${formatCurrency(recap.net)}.`
  ];

  if (topCategory) {
    lines.push(`Pola paling menonjol ada di kategori ${topCategory.categoryName} sebesar ${formatCurrency(topCategory.total)}, jadi itu titik pertama yang layak dipantau.`);
  }

  if (categoryFocus) {
    lines.push(
      `Untuk kategori ${categoryFocus.categoryName} sendiri, tercatat ${categoryFocus.transactionCount} transaksi pada periode aktif${
        categoryFocus.recentNotes.length ? ` dengan catatan seperti ${categoryFocus.recentNotes.join(", ")}` : ""
      }.`
    );

    if (categoryFocus.budget) {
      const statusLabel =
        categoryFocus.budget.status === "over"
          ? "sudah melewati"
          : categoryFocus.budget.status === "warning"
            ? "sudah mendekati"
            : "masih aman dari";

      lines.push(
        `Untuk anggaran bulan ${categoryFocus.budget.month}, kategori ini ${statusLabel} batas ${formatCurrency(categoryFocus.budget.amount)} karena baru terpakai ${formatCurrency(categoryFocus.budget.spent)} (${categoryFocus.budget.usagePercent}%) dengan sisa ${formatCurrency(categoryFocus.budget.remaining)}.`
      );
    }

    if (categoryFocus.previousPeriod) {
      const comparisonLabel =
        categoryFocus.previousPeriod.deltaAmount > 0
          ? "naik"
          : categoryFocus.previousPeriod.deltaAmount < 0
            ? "turun"
            : "stabil";
      const absoluteDelta = Math.abs(categoryFocus.previousPeriod.deltaAmount);

      lines.push(
        `Dibanding periode sebelumnya, pengeluaran kategori ini ${comparisonLabel} ${formatCurrency(absoluteDelta)} dari ${formatCurrency(categoryFocus.previousPeriod.totalExpense)}${
          categoryFocus.previousPeriod.deltaPercent !== null ? ` (${Math.abs(categoryFocus.previousPeriod.deltaPercent)}%)` : ""
        }.`
      );
    }
  }

  if (busiestWallet && recap.perWallet.length > 1) {
    lines.push(`Wallet yang paling aktif adalah ${busiestWallet.walletName} dengan ${busiestWallet.transactionCount} transaksi, jadi kemungkinan besar pergeseran cashflow utama datang dari sana.`);
  }

  return lines.join(" ");
}

export function isLowSignalAiReply(content: string) {
  const normalized = content.trim();

  if (!normalized) {
    return true;
  }

  if (normalized.length < 140 && LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return false;
}

export function buildFallbackFinanceAnswer(prompt: string, recap: AiFinancialRecap, categoryFocus: AiCategoryFocus | null = null) {
  const normalizedPrompt = prompt.toLowerCase();

  if (/(hemat|irit|tabung|save)/i.test(normalizedPrompt)) {
    return buildSavingsSuggestion(recap, categoryFocus);
  }

  if (/(analisis|pengeluaran|boros|breakdown|kategori|saldo|banding|vs|dibanding)/i.test(normalizedPrompt)) {
    return buildAnalysisResponse(recap, categoryFocus);
  }

  return buildDirectRecapMessage(recap);
}
