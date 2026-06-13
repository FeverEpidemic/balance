function normalizeMessage(message: string) {
  return message.toLocaleLowerCase("id-ID");
}

const TRANSACTION_TERMS = [
  "transaksi",
  "pengeluaran",
  "pemasukan",
  "expense",
  "income"
];

const DETAIL_TERMS = [
  "berapa",
  "jumlah",
  "berapa banyak",
  "ada apa aja",
  "apa aja",
  "apa saja",
  "daftar",
  "list",
  "detail",
  "rinci",
  "semua",
  "satu-satu",
  "terakhir",
  "terbaru",
  "recent",
  "latest"
];

const DATE_TERMS = [
  "kemarin",
  "hari ini",
  "semalam",
  "tadi",
  "minggu ini",
  "bulan ini",
  "tanggal",
  "pekan ini"
];

export function shouldForceTransactionToolCall(message: string) {
  const normalized = normalizeMessage(message);
  const mentionsTransaction = TRANSACTION_TERMS.some((term) => normalized.includes(term));
  const mentionsExplicitTransaction = normalized.includes("transaksi");
  const asksForDetail = DETAIL_TERMS.some((term) => normalized.includes(term));
  const mentionsRelativeDate =
    DATE_TERMS.some((term) => normalized.includes(term)) ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(normalized);

  return (mentionsExplicitTransaction && (asksForDetail || mentionsRelativeDate)) || (mentionsTransaction && asksForDetail && mentionsRelativeDate);
}
