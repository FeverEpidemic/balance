import { describe, expect, it } from "vitest";
import { AI_CHAT_CONSENT_VERSION, getAiChatComplianceState } from "@/lib/ai/compliance";

describe("ai chat compliance", () => {
  it("requires consent and keeps AI disabled by default", () => {
    expect(getAiChatComplianceState(null)).toEqual({
      aiChatEnabled: false,
      aiChatConsentVersion: null,
      aiChatConsentedAt: null,
      aiChatConsentRequired: true,
      isAiChatAllowed: false
    });
  });

  it("allows AI chat only when toggle is enabled and consent version is current", () => {
    const state = getAiChatComplianceState({
      ai_chat_enabled: true,
      ai_chat_consent_version: AI_CHAT_CONSENT_VERSION,
      ai_chat_consented_at: "2026-06-25T01:02:03.000Z"
    });

    expect(state.aiChatEnabled).toBe(true);
    expect(state.aiChatConsentRequired).toBe(false);
    expect(state.isAiChatAllowed).toBe(true);
  });

  it("requires re-consent when the stored consent version is outdated", () => {
    const state = getAiChatComplianceState({
      ai_chat_enabled: true,
      ai_chat_consent_version: "2026-05-legacy-v1",
      ai_chat_consented_at: "2026-05-01T00:00:00.000Z"
    });

    expect(state.aiChatEnabled).toBe(true);
    expect(state.aiChatConsentRequired).toBe(true);
    expect(state.isAiChatAllowed).toBe(false);
  });
});
