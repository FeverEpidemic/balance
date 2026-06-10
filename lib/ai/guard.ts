import "server-only";

import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/ai/guard-shared";

const promptInjectionPatterns = [
  "ignore previous",
  "ignore all previous",
  "system:",
  "[inst]",
  "pretend",
  "hack",
  "exploit",
  "write a",
  "buatkan kode",
  "tuliskan kode",
  "generate code",
  "source code",
  "developer mode",
  "jailbreak"
];

const financeKeywords = [
  "uang",
  "keuangan",
  "finansial",
  "pengeluaran",
  "pemasukan",
  "transaksi",
  "anggaran",
  "budget",
  "wallet",
  "dompet",
  "tabungan",
  "saldo",
  "cashflow",
  "cash flow",
  "hemat",
  "saving",
  "expense",
  "income",
  "spending",
  "rekap",
  "recap",
  "split bill",
  "pelunasan"
];

const nonFinanceTopicPatterns = [
  "cuaca",
  "weather",
  "resep",
  "recipe",
  "film",
  "movie",
  "musik",
  "music",
  "game",
  "gaming",
  "politik",
  "politics",
  "olahraga",
  "sports",
  "kode program",
  "code review",
  "javascript",
  "typescript",
  "next.js"
];

export type ChatMessageValidationResult =
  | { ok: true }
  | { ok: false; reason: "too_long" | "unsafe" | "off_topic" };

export function validateChatMessage(content: string): ChatMessageValidationResult {
  const normalizedContent = content.trim().toLowerCase();

  if (!normalizedContent) {
    return { ok: false, reason: "off_topic" };
  }

  if (normalizedContent.length > MAX_CHAT_MESSAGE_LENGTH) {
    return { ok: false, reason: "too_long" };
  }

  if (promptInjectionPatterns.some((pattern) => normalizedContent.includes(pattern))) {
    return { ok: false, reason: "unsafe" };
  }

  const hasFinanceKeyword = financeKeywords.some((pattern) => normalizedContent.includes(pattern));
  const hasNonFinanceTopic = nonFinanceTopicPatterns.some((pattern) => normalizedContent.includes(pattern));

  if (!hasFinanceKeyword && hasNonFinanceTopic) {
    return { ok: false, reason: "off_topic" };
  }

  return { ok: true };
}

export { MAX_CHAT_MESSAGE_LENGTH };
