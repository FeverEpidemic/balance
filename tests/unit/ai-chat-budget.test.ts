import { describe, expect, it } from "vitest";
import {
  buildBudgetedConversation,
  exceedsPreflightCompactBudget,
  shouldStopToolCallsForBudget,
  toOpenAiMessages
} from "@/lib/ai/chat-budget";
import type { ConversationMessage } from "@/lib/ai/token-budget";

describe("buildBudgetedConversation", () => {
  it("switches to compact prompt and trims lower-score history when needed", () => {
    const result = buildBudgetedConversation({
      systemPrompt: "Prompt panjang ".repeat(120),
      compactSystemPrompt: "Prompt singkat ".repeat(10),
      messages: [
        { role: "user", content: "riwayat lama tidak relevan ".repeat(20), score: 1 },
        { role: "assistant", content: "jawaban lama tidak relevan ".repeat(20), score: 1 },
        { role: "user", content: "pengeluaran makan minggu ini", score: 50 }
      ],
      tokenBudget: 1300
    });

    expect(result.usedCompactPrompt).toBe(true);
    expect(result.wasTrimmed).toBe(true);
    expect(result.conversationMessages.map((message) => message.content).join(" ")).toContain("pengeluaran makan minggu ini");
    expect(result.conversationMessages.map((message) => message.content).join(" ")).not.toContain("riwayat lama tidak relevan");
  });
});

describe("exceedsPreflightCompactBudget", () => {
  it("rejects conversations that cannot fit even the compact path", () => {
    expect(
      exceedsPreflightCompactBudget({
        messages: [{ role: "user", content: "a".repeat(20000) }],
        tokenBudget: 512
      })
    ).toBe(true);
  });
});

describe("shouldStopToolCallsForBudget", () => {
  it("stops when tool result tokens exceed the configured share", () => {
    const messages: ConversationMessage[] = [
      { role: "system", content: "System prompt" },
      { role: "assistant", content: "", tool_calls: [] },
      { role: "tool", content: JSON.stringify({ data: "x".repeat(4000) }) }
    ];

    expect(
      shouldStopToolCallsForBudget({
        messages,
        tokenBudget: 1000
      })
    ).toBe(true);
  });
});

describe("toOpenAiMessages", () => {
  it("drops internal relevance metadata before sending to the model", () => {
    const serialized = toOpenAiMessages([
      { role: "system", content: "Halo", relevanceScore: Number.POSITIVE_INFINITY },
      { role: "user", content: "Bantu analisis", relevanceScore: 100 }
    ]);

    expect(serialized).toEqual([
      { role: "system", content: "Halo" },
      { role: "user", content: "Bantu analisis" }
    ]);
  });
});
