import type { RekapPeriod } from "@/lib/chat-auth";

export type ChatIntent = "chat" | "recap";

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
};

export type OutgoingChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const CHAT_STORAGE_KEY = "balance-ai-chat:v1";
export const MAX_CHAT_MESSAGES = 24;

/** Number of most recent exchanges (user+assistant pairs) always included. */
export const CHAT_WINDOW_RECENT = 5;
/** Maximum older exchanges picked by keyword relevance. */
export const CHAT_WINDOW_RELEVANT = 3;

export function buildChatRequestMessages(input: {
  history: UiChatMessage[];
  userMessage: UiChatMessage;
  intent: ChatIntent;
}) {
  return buildWindowedChatMessages(input);
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
    return [{ role: input.userMessage.role, content: input.userMessage.content }] satisfies OutgoingChatMessage[];
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
    return recentMessages.slice(-MAX_CHAT_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content
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
  return combined.slice(-MAX_CHAT_MESSAGES).map((m) => ({
    role: m.role,
    content: m.content
  })) satisfies OutgoingChatMessage[];
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

  return {
    messages,
    selectedPeriod,
    selectedWalletId,
    activeSuggestion
  };
}
