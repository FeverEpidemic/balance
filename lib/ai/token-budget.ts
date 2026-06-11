import type { RekapPeriod } from "@/lib/chat-auth";

// ── Types ──────────────────────────────────────────────────────────────────

export type ConversationMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: unknown; // opaque; only used for budget estimation
  tool_call_id?: string;
};

// ── Constants ──────────────────────────────────────────────────────────────

/** Conservative heuristic: characters ÷ 3.5 for mixed Indonesian/English. */
const CHARS_PER_TOKEN = 3.5;

/** Default token budget for the entire conversation (system prompt + messages + tool results). */
export const DEFAULT_CHAT_TOKEN_BUDGET = 8192;

/** Maximum tokens the system prompt alone may consume before triggering compact mode. */
export const SYSTEM_PROMPT_TOKEN_LIMIT = 2048;

// ── Estimators ─────────────────────────────────────────────────────────────

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateConversationTokens(messages: ConversationMessage[]): number {
  let total = 0;
  for (const message of messages) {
    total += estimateTokenCount(message.content);
  }
  return total;
}

// ── Budgeter ───────────────────────────────────────────────────────────────

/**
 * Trims older non-system messages and/or compresses tool results to stay
 * under `maxTokens`. Preserves the system message (index 0) untouched.
 *
 * Strategy (applied in order until budget fits):
 *  1. Drop the oldest non-system messages (index 1+), one at a time, until
 *     under budget or only the system message remains.
 *  2. If still over budget, truncate the system message content to fit.
 *
 * Returns a new array — does not mutate the input.
 */
export function budgetConversationMessages(
  messages: ConversationMessage[],
  maxTokens: number
): ConversationMessage[] {
  if (messages.length === 0) return [];

  const systemIndex = messages[0]?.role === "system" ? 0 : -1;
  let working = [...messages];
  let currentTokens = estimateConversationTokens(working);

  // Drop oldest non-system messages first
  while (currentTokens > maxTokens && working.length > (systemIndex >= 0 ? 1 : 0)) {
    const dropIndex = systemIndex >= 0 ? 1 : 0;
    working = [...working.slice(0, dropIndex), ...working.slice(dropIndex + 1)];
    currentTokens = estimateConversationTokens(working);
  }

  // If still over budget, truncate system message
  if (currentTokens > maxTokens && systemIndex >= 0 && working[systemIndex]) {
    const systemMsg = working[systemIndex];
    const otherTokens = estimateConversationTokens(working.filter((_, i) => i !== systemIndex));
    const availableTokens = Math.max(0, maxTokens - otherTokens);
    const maxChars = Math.floor(availableTokens * CHARS_PER_TOKEN);
    working = [
      { ...systemMsg, content: systemMsg.content.slice(0, maxChars) },
      ...working.slice(systemIndex + 1)
    ];
  }

  return working;
}

/**
 * Returns true when the given period is too short for meaningful
 * period-over-period comparison (e.g. "day").
 */
export function isShortPeriod(period: RekapPeriod): boolean {
  return period === "day";
}
