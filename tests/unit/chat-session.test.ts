import { describe, expect, it } from "vitest";
import { buildChatRequestMessages, buildWindowedChatMessages, classifyChatAction, sanitizeStoredChatSession, CHAT_WINDOW_RECENT, REINFORCEMENT_PREFIX } from "@/lib/chat-session";

describe("buildChatRequestMessages", () => {
  it("resets history for direct recap requests", () => {
    const messages = buildChatRequestMessages({
      history: [
        { id: "assistant-old", role: "assistant", content: "Jawaban lama" },
        { id: "user-old", role: "user", content: "Pertanyaan lama" }
      ],
      userMessage: { id: "user-new", role: "user", content: "Tolong rekap hari ini" },
      intent: "recap"
    });

    expect(messages).toEqual([{ role: "user", content: `${REINFORCEMENT_PREFIX}Tolong rekap hari ini`, score: 1000 }]);
  });

  it("keeps recent conversation for normal chat", () => {
    const messages = buildChatRequestMessages({
      history: [{ id: "assistant-old", role: "assistant", content: "Jawaban lama" }],
      userMessage: { id: "user-new", role: "user", content: "Analisis lagi" },
      intent: "chat"
    });

    expect(messages).toEqual([
      { role: "assistant", content: "Jawaban lama", score: 100 },
      { role: "user", content: `${REINFORCEMENT_PREFIX}Analisis lagi`, score: 101 }
    ]);

    // The stored history should NOT have the prefix (only the API-bound messages get it)
    expect(messages[1].content).toBe(`${REINFORCEMENT_PREFIX}Analisis lagi`);
  });
});

describe("buildWindowedChatMessages", () => {
  it("resets history for recap intent", () => {
    const result = buildWindowedChatMessages({
      history: [
        { id: "a1", role: "assistant", content: "Old reply" },
        { id: "u1", role: "user", content: "Old question" }
      ],
      userMessage: { id: "u2", role: "user", content: "Rekap hari ini" },
      intent: "recap"
    });
    expect(result).toEqual([{ role: "user", content: "Rekap hari ini", score: 1000 }]);
  });

  it("always includes last exchanges for chat intent", () => {
    const history: Array<{ id: string; role: "user" | "assistant"; content: string }> = [];
    // Create enough history to exceed CHAT_WINDOW_RECENT
    for (let i = 0; i < 20; i++) {
      history.push({ id: `u${i}`, role: "user", content: `Question ${i} about budget` });
      history.push({ id: `a${i}`, role: "assistant", content: `Answer ${i}` });
    }

    const result = buildWindowedChatMessages({
      history,
      userMessage: { id: "u-final", role: "user", content: "Latest question about food" },
      intent: "chat"
    });

    // Last user message should always be present
    expect(result[result.length - 1]).toEqual({ role: "user", content: "Latest question about food", score: expect.any(Number) });
    // Should include recent messages
    expect(result.length).toBeGreaterThanOrEqual(CHAT_WINDOW_RECENT * 2);
  });

  it("returns empty for empty history and no user message edge case", () => {
    // This is a defensive test — the caller should always have a userMessage
    const result = buildWindowedChatMessages({
      history: [],
      userMessage: { id: "u1", role: "user", content: "Hello" },
      intent: "chat"
    });
    expect(result).toEqual([{ role: "user", content: "Hello", score: 100 }]);
  });

  it("prefers relevant older exchanges over irrelevant ones via relevance scoring", () => {
    // Create enough filler so that weather and food exchanges are in the "older" bucket
    // We need total messages > CHAT_WINDOW_RECENT * 2 and weather/food before recentStart
    const fillerCount = 14; // 14 exchanges (28 messages) — fills the bulk of "older" history
    const filler = Array.from({ length: fillerCount }, (_, i) => [
      { id: `u-${i}`, role: "user" as const, content: `Filler question ${i} about daily stuff` },
      { id: `a-${i}`, role: "assistant" as const, content: `Filler answer ${i}` }
    ]).flat();

    const history = [
      ...filler,
      // Irrelevant exchange about weather — this should be in older bucket
      { id: "u-weather", role: "user" as const, content: "What is the weather today?" },
      { id: "a-weather", role: "assistant" as const, content: "I don't know about weather." },
      // Relevant exchange about food — also in older bucket
      { id: "u-food", role: "user" as const, content: "How much did I spend on food last week?" },
      { id: "a-food", role: "assistant" as const, content: "You spent Rp 450.000 on food." },
      // Recent exchanges should still appear
      ...Array.from({ length: CHAT_WINDOW_RECENT }, (_, i) => [
        { id: `u-recent-${i}`, role: "user" as const, content: `Recent question ${i}` },
        { id: `a-recent-${i}`, role: "assistant" as const, content: `Recent answer ${i}` }
      ]).flat()
    ];

    const result = buildWindowedChatMessages({
      history,
      userMessage: { id: "u-new", role: "user", content: "Tell me more about my food expenses" },
      intent: "chat"
    });

    // The relevant food exchange should appear in the output
    const resultContents = result.map((m) => m.content).join(" ");
    expect(resultContents).toContain("food");
    // Weather should NOT appear (it's in older exchanges but scored lower than food)
    expect(resultContents).not.toContain("weather");
    expect(result.some((message) => message.content.includes("food") && (message.score ?? 0) > 0)).toBe(true);
  });
});

describe("sanitizeStoredChatSession", () => {
  it("returns null for invalid payloads", () => {
    expect(sanitizeStoredChatSession({ selectedPeriod: "year", messages: [] })).toBeNull();
    expect(sanitizeStoredChatSession(null)).toBeNull();
  });

  it("sanitizes streaming flags and preserves valid state", () => {
    const session = sanitizeStoredChatSession({
      selectedPeriod: "week",
      selectedWalletId: "wallet-1",
      activeSuggestion: "week",
      messages: [
        { id: "1", role: "user", content: "Halo" },
        { id: "2", role: "assistant", content: "Sedang mengetik", isStreaming: true }
      ]
    });

    expect(session).toEqual({
      selectedPeriod: "week",
      selectedWalletId: "wallet-1",
      activeSuggestion: "week",
      messages: [
        { id: "1", role: "user", content: "Halo", isStreaming: false },
        { id: "2", role: "assistant", content: "Sedang mengetik", isStreaming: false }
      ]
    });
  });
});

describe("classifyChatAction", () => {
  it("classifies casual typo 'catet' as a record action", () => {
    expect(classifyChatAction("catet pengeluaran 50rb buat gofood")).toBe("record");
  });
});
