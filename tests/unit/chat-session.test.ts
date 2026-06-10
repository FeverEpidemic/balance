import { describe, expect, it } from "vitest";
import { buildChatRequestMessages, sanitizeStoredChatSession } from "@/lib/chat-session";

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

    expect(messages).toEqual([{ role: "user", content: "Tolong rekap hari ini" }]);
  });

  it("keeps recent conversation for normal chat", () => {
    const messages = buildChatRequestMessages({
      history: [{ id: "assistant-old", role: "assistant", content: "Jawaban lama" }],
      userMessage: { id: "user-new", role: "user", content: "Analisis lagi" },
      intent: "chat"
    });

    expect(messages).toEqual([
      { role: "assistant", content: "Jawaban lama" },
      { role: "user", content: "Analisis lagi" }
    ]);
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
