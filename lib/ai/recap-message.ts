import type { AiFinancialRecap } from "@/lib/ai/data";
import type { RekapPeriod } from "@/lib/chat-auth";
import { formatCurrency } from "@/lib/utils";

function getPeriodLabel(period: RekapPeriod) {
  switch (period) {
    case "day":
      return "hari ini";
    case "week":
      return "minggu ini";
    case "month":
    default:
      return "bulan ini";
  }
}

function formatUtcDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(date));
}

function formatRangeLabel(recap: AiFinancialRecap) {
  const start = formatUtcDate(recap.range.start);
  const end = formatUtcDate(recap.range.end);

  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
}

export function buildDirectRecapMessage(recap: AiFinancialRecap) {
  const header = `Rekap ${getPeriodLabel(recap.period)} untuk ${recap.walletLabel} (${formatRangeLabel(recap)}).`;

  if (recap.transactionCount === 0) {
    return [
      header,
      "",
      "Belum ada transaksi yang tercatat di periode ini.",
      "Kalau mau, kamu bisa pilih wallet lain atau tanya analisis untuk bulan ini supaya saya bantu baca pola yang sudah ada."
    ].join("\n");
  }

  const lines = [
    header,
    "",
    `- Pemasukan: ${formatCurrency(recap.totalIncome)}`,
    `- Pengeluaran: ${formatCurrency(recap.totalExpense)}`,
    `- Net: ${formatCurrency(recap.net)}`,
    `- Jumlah transaksi: ${recap.transactionCount}`
  ];

  const topCategory = recap.topExpenseCategories[0];
  if (topCategory) {
    lines.push(`- Pengeluaran terbesar ada di kategori ${topCategory.categoryName}: ${formatCurrency(topCategory.total)}`);
  }

  const busiestWallet = [...recap.perWallet]
    .sort((a, b) => {
      if (b.transactionCount !== a.transactionCount) {
        return b.transactionCount - a.transactionCount;
      }

      return b.totalExpense - a.totalExpense;
    })[0];

  if (busiestWallet && recap.perWallet.length > 1) {
    lines.push(
      "",
      `Wallet yang paling aktif saat ini adalah ${busiestWallet.walletName} dengan ${busiestWallet.transactionCount} transaksi dan net ${formatCurrency(busiestWallet.net)}.`
    );
  } else if (recap.net < 0) {
    lines.push("", "Arus kas periode ini lagi negatif, jadi pengeluaran layak dipantau lebih dekat beberapa hari ke depan.");
  } else {
    lines.push("", "Arus kas periode ini masih terjaga positif, jadi tinggal dipantau supaya ritmenya tetap stabil.");
  }

  return lines.join("\n");
}
