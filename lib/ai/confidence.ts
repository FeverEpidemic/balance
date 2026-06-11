import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getDailySpendingCapAmount, getDailySpendingCapEnabled } from "@/lib/env";
import { getTodayDateString } from "@/lib/utils";

export type ConfidenceResult = {
  score: number;
  tier: "high" | "medium" | "low";
  flags: string[];
  reasons: string[];
};

export type DuplicateCheckResult = {
  isDuplicate: boolean;
  existingTransaction?: {
    id: string;
    amount: number;
    happenedAt: string;
  };
};

export type DailyCapResult = {
  exceeded: boolean;
  todayTotal: number;
  threshold: number;
};

export type ConfidenceParams = {
  walletId: string;
  kind: "income" | "expense";
  amount: number;
  categoryId?: string | null;
  categoryName?: string | null;
  note?: string | null;
  happenedAt?: string | null;
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function computeTier(score: number): "high" | "medium" | "low" {
  if (score >= 85) return "high";
  if (score >= 50) return "medium";
  return "low";
}

/**
 * Extract all numeric values from user message (including Rp/IDR prefixed amounts).
 */
function extractAmountsFromText(text: string): number[] {
  const regex = /(?:Rp\s?|IDR\s?)?(\d[\d.,]*\d|\d)\b/gi;
  const matches: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Remove non-numeric characters except dots/commas
    const raw = match[1].replace(/[^\d.,]/g, "");
    // Try parsing as Indonesian format (1.500 = 1500)
    const withDots = raw.replace(/\./g, "");
    const normalized = Number(withDots.replace(/,/g, ""));

    if (Number.isFinite(normalized) && normalized > 0) {
      matches.push(normalized);
    }
  }

  return matches;
}

/**
 * Find the closest amount from extracted values compared to the target.
 * Returns the ratio (closest / target). If no amounts found, returns null.
 */
function findClosestAmountRatio(
  extractedAmounts: number[],
  targetAmount: number
): number | null {
  if (extractedAmounts.length === 0 || targetAmount <= 0) {
    return null;
  }

  let closestRatio = Infinity;

  for (const extracted of extractedAmounts) {
    const ratio = extracted / targetAmount;

    if (ratio < 1) {
      closestRatio = Math.min(closestRatio, 1 / ratio);
    } else {
      closestRatio = Math.min(closestRatio, ratio);
    }
  }

  return closestRatio;
}

/**
 * Check if user message contains intent keywords for recording a transaction.
 */
function hasIntentKeywords(text: string): boolean {
  const intentPattern =
    /\b(catat|simpan|buatkan?\s?transaksi|record|tambah|input|masukkan?)\b/i;
  return intentPattern.test(text);
}

/**
 * Check if user message contains a wallet name (exact substring match).
 */
function containsWalletName(text: string, walletName: string): boolean {
  if (!walletName) return false;
  return text.toLowerCase().includes(walletName.toLowerCase());
}

/**
 * Check if a specific date was mentioned in the user message.
 */
function hasExplicitDate(text: string): boolean {
  // Check for date patterns like "2026-06-15", "15 Juni 2026", etc.
  const datePatterns = [
    /\d{4}-\d{2}-\d{2}/, // ISO dates
    /\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}/i, // "15 Juni 2026"
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{4}/i, // "15 Jun 2026"
    /(kemarin|lusa|besok|hari\s+ini|tadi\s+malam|tadi\s+pagi|tadi\s+siang)/i // Relative dates
  ];

  return datePatterns.some((pattern) => pattern.test(text));
}

/**
 * Compute confidence score for an AI-proposed transaction.
 * All DB-independent computation.
 */
export function computeTransactionConfidence(
  params: ConfidenceParams,
  userMessage: string,
  walletName?: string | null
): ConfidenceResult {
  const flags: string[] = [];
  const reasons: string[] = [];
  let score = 40; // neutral base score

  // 1. Amount cross-validation
  const extractedAmounts = extractAmountsFromText(userMessage);
  const closestRatio = findClosestAmountRatio(extractedAmounts, params.amount);

  if (extractedAmounts.length === 0) {
    // No amounts found in text — neutral
    reasons.push("Tidak ada nominal yang disebut di teks");
  } else if (closestRatio !== null && closestRatio <= 1.1) {
    // Match found within 10%
    score += 10;
    reasons.push("Nominal cocok dengan yang disebut di teks");
  } else {
    // Mismatch > 10%
    flags.push("AMOUNT_MISMATCH");
    score -= 20;
    reasons.push("Nominal tidak cocok dengan angka di teks Anda");
  }

  // 2. Category confidence
  if (params.categoryId) {
    score += 30;
    reasons.push("Kategori dipilih dari ID yang tersedia");
  } else if (params.categoryName) {
    score += 15;
    reasons.push("Kategori disebut berdasarkan nama");
  } else {
    reasons.push("Kategori tidak disebut");
  }

  // 3. Wallet confidence
  if (walletName && containsWalletName(userMessage, walletName)) {
    score += 25;
    reasons.push("Wallet disebut dalam teks");
  } else if (walletName) {
    reasons.push("Wallet tidak disebut dalam teks");
  } else {
    reasons.push("Nama wallet tidak tersedia untuk verifikasi");
  }

  // 4. Intent clarity
  if (hasIntentKeywords(userMessage)) {
    score += 25;
    reasons.push("Teks mengandung kata kunci pencatatan");
  } else {
    reasons.push("Tidak ada kata kunci pencatatan yang jelas");
  }

  // 5. HappenedAt confidence
  const today = getTodayDateString();
  if (params.happenedAt && params.happenedAt !== today) {
    score += 10;
    reasons.push("Tanggal eksplisit disebut");
  } else if (hasExplicitDate(userMessage)) {
    score += 10;
    reasons.push("Tanggal disebut dalam teks");
  } else {
    score += 5;
    reasons.push("Menggunakan tanggal hari ini");
  }

  return {
    score: clampScore(score),
    tier: computeTier(clampScore(score)),
    flags,
    reasons
  };
}

/**
 * Check if a duplicate transaction exists within the last 5 minutes.
 */
export async function checkDuplicateTransaction(
  userId: string,
  walletId: string,
  kind: "income" | "expense",
  amount: number
): Promise<DuplicateCheckResult> {
  const supabase = await createClient();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const lowerBound = amount * 0.9;
  const upperBound = amount * 1.1;

  const { data } = await supabase
    .from("transactions")
    .select("id, amount, happened_at")
    .eq("wallet_id", walletId)
    .eq("kind", kind)
    .gte("amount", lowerBound)
    .lte("amount", upperBound)
    .gt("created_at", fiveMinutesAgo)
    .limit(1)
    .maybeSingle();

  if (data) {
    return {
      isDuplicate: true,
      existingTransaction: {
        id: data.id,
        amount: data.amount,
        happenedAt: data.happened_at
      }
    };
  }

  return { isDuplicate: false };
}

/**
 * Check if a new expense would exceed the daily spending cap.
 */
export async function checkDailySpendingCap(
  userId: string,
  walletId: string,
  newAmount: number
): Promise<DailyCapResult> {
  const enabled = getDailySpendingCapEnabled();

  if (!enabled) {
    return { exceeded: false, todayTotal: 0, threshold: 0 };
  }

  const threshold = getDailySpendingCapAmount();
  const todayStart = getTodayDateString() + "T00:00:00.000Z";
  const now = new Date().toISOString();

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("amount")
    .eq("wallet_id", walletId)
    .eq("kind", "expense")
    .gte("happened_at", todayStart)
    .lte("happened_at", now);

  const todayTotal = (data ?? []).reduce((sum, row) => sum + row.amount, 0);
  const projectedTotal = todayTotal + newAmount;
  const exceeded = projectedTotal > threshold;

  return { exceeded, todayTotal, threshold };
}

/**
 * Resolve wallet name from walletId for confidence checking.
 */
export async function resolveWalletName(
  walletId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallets")
    .select("name")
    .eq("id", walletId)
    .maybeSingle();

  return data?.name ?? null;
}
