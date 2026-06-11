import { describe, expect, it } from "vitest";
import {
  budgetConversationMessages,
  CHAT_MESSAGE_FRAMING_TOKENS,
  estimateConversationTokens,
  estimateTokenCount,
  isShortPeriod,
  TOOL_DEFINITION_TOKEN_OVERHEAD
} from "@/lib/ai/token-budget";

describe("estimateTokenCount", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokenCount("")).toBe(0);
  });

  it("estimates tokens for long unbroken strings", () => {
    expect(estimateTokenCount("a".repeat(38))).toBe(10);
    expect(estimateTokenCount("a".repeat(39))).toBe(11);
  });

  it("handles mixed Indonesian text", () => {
    const text = "Pengeluaran bulan ini untuk kategori Makan sebesar Rp 450.000";
    const estimate = estimateTokenCount(text);
    expect(estimate).toBeGreaterThan(0);
    expect(estimate).toBeLessThan(text.length); // tokens < chars for normal text
  });
});

describe("estimateConversationTokens", () => {
  it("sums token estimates across messages", () => {
    const messages = [
      { role: "system" as const, content: "Hello world" },
      { role: "user" as const, content: "How are you?" }
    ];
    const expected =
      estimateTokenCount("Hello world") +
      estimateTokenCount("How are you?") +
      2 * CHAT_MESSAGE_FRAMING_TOKENS;
    expect(estimateConversationTokens(messages)).toBe(expected);
  });

  it("returns 0 for empty array", () => {
    expect(estimateConversationTokens([])).toBe(0);
  });

  it("includes tool-definition overhead when requested", () => {
    const messages = [{ role: "user" as const, content: "Halo" }];
    expect(
      estimateConversationTokens(messages, {
        includeToolDefinitions: true
      })
    ).toBe(estimateConversationTokens(messages) + TOOL_DEFINITION_TOKEN_OVERHEAD);
  });
});

describe("budgetConversationMessages", () => {
  it("returns same array when under budget", () => {
    const messages = [
      { role: "system" as const, content: "Short" },
      { role: "user" as const, content: "Hi" }
    ];
    const result = budgetConversationMessages(messages, 10000);
    expect(result).toEqual(messages);
  });

  it("trims least-relevant non-system messages first", () => {
    const messages = [
      { role: "system" as const, content: "System" },
      { role: "user" as const, content: "Old msg 1", relevanceScore: 1 },
      { role: "assistant" as const, content: "Old reply 1", relevanceScore: 1 },
      { role: "user" as const, content: "Relevant old msg", relevanceScore: 9 },
      { role: "assistant" as const, content: "Relevant old reply", relevanceScore: 9 },
      { role: "user" as const, content: "New msg", relevanceScore: 100 }
    ];
    const budget = estimateConversationTokens(messages) - estimateTokenCount("Old msg 1") - CHAT_MESSAGE_FRAMING_TOKENS - 1;
    const result = budgetConversationMessages(messages, budget);
    expect(result.length).toBeLessThan(messages.length);
    expect(result[0]).toEqual(messages[0]); // system preserved
    expect(result.map((message) => message.content)).not.toContain("Old msg 1");
    expect(result.map((message) => message.content)).toContain("Relevant old msg");
  });

  it("preserves system message even under extreme budget", () => {
    const messages = [
      { role: "system" as const, content: "System prompt here" },
      { role: "user" as const, content: "Hello" }
    ];
    const result = budgetConversationMessages(messages, 1);
    expect(result.length).toBe(1);
    expect(result[0]?.role).toBe("system");
  });

  it("returns empty array for empty input", () => {
    expect(budgetConversationMessages([], 100)).toEqual([]);
  });
});

describe("isShortPeriod", () => {
  it("returns true for day", () => {
    expect(isShortPeriod("day")).toBe(true);
  });
  it("returns false for week and month", () => {
    expect(isShortPeriod("week")).toBe(false);
    expect(isShortPeriod("month")).toBe(false);
  });
});
