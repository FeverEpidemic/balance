import type { RekapPeriod } from "@/lib/chat-auth";

// ── Types ──────────────────────────────────────────────────────────────────

export type ConversationMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: unknown; // opaque; only used for budget estimation
  tool_call_id?: string;
  relevanceScore?: number;
};

// ── Constants ──────────────────────────────────────────────────────────────

/** Approximate characters-per-token for mixed Indonesian/English prose. */
const CHARS_PER_TOKEN = 3.8;

/** Approximate per-message protocol overhead for chat payload framing. */
export const CHAT_MESSAGE_FRAMING_TOKENS = 4;

/** Approximate token overhead of always-sent tool definitions in chat mode. */
export const TOOL_DEFINITION_TOKEN_OVERHEAD = 1_150;

/** Minimal compact system prompt allowance used for pre-flight checks. */
export const COMPACT_SYSTEM_PROMPT_FLOOR_TOKENS = 320;

/** Default token budget for the entire conversation (system prompt + messages + tool results). */
export const DEFAULT_CHAT_TOKEN_BUDGET = 8192;

/** Maximum tokens the system prompt alone may consume before triggering compact mode. */
export const SYSTEM_PROMPT_TOKEN_LIMIT = 2048;

// ── Estimators ─────────────────────────────────────────────────────────────

export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return 0;
  }

  const charEstimate = Math.ceil(normalized.length / CHARS_PER_TOKEN);
  const wordCount = normalized.split(" ").filter(Boolean).length;
  const numberCount = (normalized.match(/\d[\d.,]*/g) ?? []).length;
  const punctuationCount = (normalized.match(/[()[\]{}:;,.!?'"-]/g) ?? []).length;
  const wordEstimate =
    Math.ceil(wordCount * 1.35) + Math.ceil(numberCount * 0.5) + Math.ceil(punctuationCount * 0.1);

  return Math.max(charEstimate, wordEstimate);
}

export function estimateConversationTokens(
  messages: ConversationMessage[],
  options?: {
    includeMessageFraming?: boolean;
    includeToolDefinitions?: boolean;
    extraTokens?: number;
  }
): number {
  let total = 0;
  for (const message of messages) {
    total += estimateTokenCount(message.content);
  }

  if (options?.includeMessageFraming !== false) {
    total += messages.length * CHAT_MESSAGE_FRAMING_TOKENS;
  }

  if (options?.includeToolDefinitions) {
    total += TOOL_DEFINITION_TOKEN_OVERHEAD;
  }

  total += options?.extraTokens ?? 0;

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
  maxTokens: number,
  options?: {
    includeMessageFraming?: boolean;
    includeToolDefinitions?: boolean;
    extraTokens?: number;
  }
): ConversationMessage[] {
  if (messages.length === 0) return [];

  const systemIndex = messages[0]?.role === "system" ? 0 : -1;
  let working = [...messages];
  let currentTokens = estimateConversationTokens(working, options);

  // Drop the least relevant non-system messages first, then older ones on ties.
  while (currentTokens > maxTokens && working.length > (systemIndex >= 0 ? 1 : 0)) {
    const dropCandidates = working
      .map((message, index) => ({ index, message }))
      .filter(({ index, message }) => {
        if (index === systemIndex) {
          return false;
        }

        // Always preserve the latest user turn when possible.
        if (message.role === "user" && index === working.length - 1) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        const scoreDelta = (left.message.relevanceScore ?? 0) - (right.message.relevanceScore ?? 0);

        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return left.index - right.index;
      });

    const dropIndex = dropCandidates[0]?.index;

    if (dropIndex === undefined) {
      break;
    }

    working = [...working.slice(0, dropIndex), ...working.slice(dropIndex + 1)];
    currentTokens = estimateConversationTokens(working, options);
  }

  // If still over budget, truncate system message
  if (currentTokens > maxTokens && systemIndex >= 0 && working[systemIndex]) {
    const systemMsg = working[systemIndex];
    const otherTokens = estimateConversationTokens(
      working.filter((_, i) => i !== systemIndex),
      options
    );
    const availableTokens = Math.max(0, maxTokens - otherTokens);
    const maxChars = Math.floor(availableTokens * CHARS_PER_TOKEN);
    working = [
      { ...systemMsg, content: systemMsg.content.slice(0, maxChars) },
      ...working.slice(systemIndex + 1)
    ];
    currentTokens = estimateConversationTokens(working, options);
  }

  while (currentTokens > maxTokens && working.length > (systemIndex >= 0 ? 1 : 0)) {
    const dropIndex = systemIndex >= 0 ? 1 : 0;
    working = [...working.slice(0, dropIndex), ...working.slice(dropIndex + 1)];
    currentTokens = estimateConversationTokens(working, options);
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
