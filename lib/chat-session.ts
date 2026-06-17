import type { RekapPeriod } from "@/lib/chat-auth";

export type ChatIntent = "chat" | "recap";

/**
 * Action classification for user messages.
 * - insight: user wants financial analysis, recap, trends
 * - record: user wants to record a transaction
 * - edit: user wants to edit/change existing data
 * - general: catch-all for other conversation
 */
export type ChatAction = "insight" | "record" | "edit" | "general";

/**
 * Classifies a user message into a ChatAction using heuristic keyword matching.
 * Run on the client before sending to the API.
 */
export function classifyChatAction(message: string): ChatAction {
  const normalized = message.toLocaleLowerCase("id-ID").trim();

  // Record transaction patterns
  const recordPatterns = [
    /(^|\s)(catat|catet|tambah|simpan|buat|input|record|add|new)(\s|$)/i,
    /(^|\s)(beli|bayar|keluar|jual|terima|dapat|transfer|tarik|setor|gaji)(\s|$)/i,
    /(^|\s)(pengeluaran|pemasukan|transaksi)\s+(baru|)/i,
    /(rp|rupiah|ribu|juta|rb)\s/,
    /^\s*(beli|bayar|jual|transfer)\s/i,
    /transaksi\s+(makan|transport|belanja|hiburan|tagihan|bensin|listrik|air|pulsa|kuota)/i,
  ];
  for (const pattern of recordPatterns) {
    if (pattern.test(normalized)) {
      return "record";
    }
  }

  // Edit/change patterns
  const editPatterns = [
    /(^|\s)(ubah|edit|ganti|update|hapus|delete|koreksi|perbaiki|change)(\s|$)/i,
    /(^|\s)(rubah|betulin)(\s|$)/i,
    /salah\s+(catat|input|tulis)/i,
    /ganti\s+(nominal|kategori|tanggal|wallet)/i,
  ];
  for (const pattern of editPatterns) {
    if (pattern.test(normalized)) {
      return "edit";
    }
  }

  // Insight/analysis patterns
  const insightPatterns = [
    /(^|\s)(rekap|ringkasan|summary|analisa|analisis|analys)(\s|$)/i,
    /(^|\s)(berapa|berapa banyak|seberapa|bagaimana|kenapa|mengapa|apa\s+penyebab)(\s|$)/i,
    /(^|\s)(perbandingan|bandingkan|trend|pola|pattern|insight|wawasan)(\s|$)/i,
    /(^|\s)(grafik|chart|diagram|visual)(\s|$)/i,
    /(^|\s)(bulan|minggu|hari)\s+(ini|lalu|kemarin|depan|sebelumnya)/i,
    /total\s+(pengeluaran|pemasukan|belanja)/i,
    /paling\s+(besar|kecil|banyak|sering)/i,
    /(^|\s)(habis|boros|irit|hemat|overbudget|over\s*budget|anggaran)(\s|$)/i,
    /\?\s*$/,
    /(^|\s)(tunjukkin|lihat|cek|check|lihat|show)(\s|$)/i,
  ];
  for (const pattern of insightPatterns) {
    if (pattern.test(normalized)) {
      return "insight";
    }
  }

  return "general";
}

/**
 * Reinforcement prefix added to user messages to remind the AI of its role
 * in multi-turn conversations.
 */
export const REINFORCEMENT_PREFIX =
  "[Sistem: Kamu adalah asisten keuangan pribadi Balance. Jawab dalam Bahasa Indonesia yang ramah dan ringkas, fokus pada analisis finansial pengguna.]\n\n";

export type UiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

export type StoredChatSession = {
  messages: UiChatMessage[];
  selectedPeriod: RekapPeriod;
  selectedWalletId: string;
  activeSuggestion?: string;
  /** Compact financial summary of what was discussed in previous turns. */
  runningSummary?: string;
  /** Timestamp (ms) when session was last saved. Used for auto-expiry. */
  savedAt?: number;
};

export type OutgoingChatMessage = {
  role: "user" | "assistant";
  content: string;
  score?: number;
};

export const CHAT_STORAGE_KEY = "balance-ai-chat:v1";
export const CHAT_MAX_AGE_DAYS = 30;
export const MAX_CHAT_MESSAGES = 24;

/** Number of most recent exchanges (user+assistant pairs) always included. */
export const CHAT_WINDOW_RECENT = 5;
/** Maximum older exchanges picked by keyword relevance. */
export const CHAT_WINDOW_RELEVANT = 3;

/**
 * Prepares chat messages for the AI API, adding a role-reinforcement prefix
 * to each user message so the AI maintains its identity across multi-turn chats.
 */
export function buildChatRequestMessages(input: {
  history: UiChatMessage[];
  userMessage: UiChatMessage;
  intent: ChatIntent;
}): OutgoingChatMessage[] {
  const reinforcedUserMessage: UiChatMessage = {
    ...input.userMessage,
    content: `${REINFORCEMENT_PREFIX}${input.userMessage.content}`
  };
  return buildWindowedChatMessages({ ...input, userMessage: reinforcedUserMessage });
}

/**
 * Builds windowed chat messages with recency bias + relevance scoring.
 *
 * - Always includes the last CHAT_WINDOW_RECENT exchanges (up to 10 messages).
 * - Scores older exchanges by normalized-word overlap with the current user message.
 * - Prepends the top CHAT_WINDOW_RELEVANT older exchanges.
 * - Never exceeds MAX_CHAT_MESSAGES as a hard ceiling.
 */
export function buildWindowedChatMessages(input: {
  history: UiChatMessage[];
  userMessage: UiChatMessage;
  intent: ChatIntent;
}): OutgoingChatMessage[] {
  if (input.intent === "recap") {
    return [{ role: input.userMessage.role, content: input.userMessage.content, score: 1_000 }] satisfies OutgoingChatMessage[];
  }

  const allMessages = [...input.history, input.userMessage];
  const totalMessages = allMessages.length;

  // Nothing to window
  if (totalMessages === 0) return [];

  const recentCount = CHAT_WINDOW_RECENT * 2; // user+assistant pairs → messages
  const recentStart = Math.max(0, totalMessages - recentCount);
  const recentMessages = allMessages.slice(recentStart);
  const olderMessages = allMessages.slice(0, recentStart);

  // If no older messages, just return recent ones capped at MAX
  if (olderMessages.length === 0) {
    return recentMessages.slice(-MAX_CHAT_MESSAGES).map((m, index) => ({
      role: m.role,
      content: m.content,
      score: 100 + index
    })) satisfies OutgoingChatMessage[];
  }

  // Score older exchanges (pairs of user+assistant) by keyword overlap
  const currentWords = tokenizeWords(input.userMessage.content);
  const olderExchanges: Array<{ messages: UiChatMessage[]; score: number }> = [];

  for (let i = 0; i < olderMessages.length; i += 2) {
    const pair = olderMessages.slice(i, i + 2);
    const combinedText = pair.map((m) => m.content).join(" ");
    const score = computeOverlapScore(currentWords, tokenizeWords(combinedText));
    olderExchanges.push({ messages: pair, score });
  }

  // Pick top CHAT_WINDOW_RELEVANT exchanges
  olderExchanges.sort((a, b) => b.score - a.score);
  const pickedOlder = olderExchanges.slice(0, CHAT_WINDOW_RELEVANT).flatMap((e) => e.messages);

  // Combine: picked older + recent, cap at MAX
  const combined = [...pickedOlder, ...recentMessages];
  const capped = combined.slice(-MAX_CHAT_MESSAGES);
  const recentSet = new Set(recentMessages.map((message) => message.id));

  return capped.map((message, index) => {
    const fromRecent = recentSet.has(message.id);
    const olderExchange = olderExchanges.find((exchange) => exchange.messages.some((entry) => entry.id === message.id));

    return {
      role: message.role,
      content: message.content,
      score: fromRecent ? 100 + index : olderExchange?.score ?? 0
    };
  }) satisfies OutgoingChatMessage[];
}

/** Split text into normalized lowercase word tokens for overlap scoring. */
function tokenizeWords(text: string): Set<string> {
  return new Set(
    text
      .toLocaleLowerCase("id-ID")
      .normalize("NFKD")
      .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

/** Count how many words from `query` appear in `candidate`. Simple IDF-like overlap. */
function computeOverlapScore(query: Set<string>, candidate: Set<string>): number {
  if (query.size === 0) return 0;
  let overlap = 0;
  for (const word of query) {
    if (candidate.has(word)) overlap += 1;
  }
  return overlap;
}

export function clearChatHistory(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  }
}

export function sanitizeStoredChatSession(value: unknown): StoredChatSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<StoredChatSession>;
  const selectedPeriod = candidate.selectedPeriod;
  const selectedWalletId = typeof candidate.selectedWalletId === "string" ? candidate.selectedWalletId : "";
  const activeSuggestion = typeof candidate.activeSuggestion === "string" ? candidate.activeSuggestion : undefined;

  if (selectedPeriod !== "day" && selectedPeriod !== "week" && selectedPeriod !== "month") {
    return null;
  }

  if (!Array.isArray(candidate.messages)) {
    return null;
  }

  const messages = candidate.messages
    .filter((message): message is UiChatMessage => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const entry = message as Partial<UiChatMessage>;
      return (
        typeof entry.id === "string" &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string" &&
        (entry.isStreaming === undefined || typeof entry.isStreaming === "boolean")
      );
    })
    .map((message) => ({
      ...message,
      isStreaming: false
    }))
    .slice(-MAX_CHAT_MESSAGES);

  const savedAt = typeof candidate.savedAt === "number" && candidate.savedAt > 0
    ? candidate.savedAt
    : undefined;

  // Check expiry: if savedAt exists and is older than CHAT_MAX_AGE_DAYS, treat as expired
  if (savedAt !== undefined) {
    const maxAgeMs = CHAT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - savedAt > maxAgeMs) {
      return null;
    }
  }

  return {
    messages,
    selectedPeriod,
    selectedWalletId,
    activeSuggestion,
    runningSummary: typeof candidate.runningSummary === "string" ? candidate.runningSummary : undefined,
    savedAt
  };
}
