import { describe, expect, it } from "vitest";
import { shouldSubmitChatFromKeydown } from "@/lib/chat-input-shortcuts";

describe("shouldSubmitChatFromKeydown", () => {
  it("does not submit on plain Enter", () => {
    expect(
      shouldSubmitChatFromKeydown({
        key: "Enter",
        ctrlKey: false,
        metaKey: false
      })
    ).toBe(false);
  });

  it("submits on Ctrl+Enter", () => {
    expect(
      shouldSubmitChatFromKeydown({
        key: "Enter",
        ctrlKey: true,
        metaKey: false
      })
    ).toBe(true);
  });

  it("submits on Cmd+Enter", () => {
    expect(
      shouldSubmitChatFromKeydown({
        key: "Enter",
        ctrlKey: false,
        metaKey: true
      })
    ).toBe(true);
  });
});
