import { describe, expect, it } from "vitest";
import { shouldReturnDirectAiReply } from "@/lib/ai/chat-response";

describe("shouldReturnDirectAiReply", () => {
  it("returns true when the assistant already produced a final non-tool answer", () => {
    expect(
      shouldReturnDirectAiReply({
        assistantContent: "Ini jawaban final.",
        hasToolCalls: false
      })
    ).toBe(true);
  });

  it("returns false when the assistant still requested tool calls", () => {
    expect(
      shouldReturnDirectAiReply({
        assistantContent: "Saya cek dulu.",
        hasToolCalls: true
      })
    ).toBe(false);
  });

  it("returns false for empty content", () => {
    expect(
      shouldReturnDirectAiReply({
        assistantContent: "   ",
        hasToolCalls: false
      })
    ).toBe(false);
  });
});
