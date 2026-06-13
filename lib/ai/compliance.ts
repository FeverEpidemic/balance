import type { ProfileRow } from "@/lib/data/types";

export const AI_CHAT_CONSENT_VERSION = "2026-06-deepseek-china-disclosure-v1";

export type AiChatComplianceState = {
  aiChatEnabled: boolean;
  aiChatConsentVersion: string | null;
  aiChatConsentedAt: string | null;
  aiChatConsentRequired: boolean;
  isAiChatAllowed: boolean;
};

export function getAiChatComplianceState(
  profile: Pick<ProfileRow, "ai_chat_enabled" | "ai_chat_consent_version" | "ai_chat_consented_at"> | null | undefined
): AiChatComplianceState {
  const aiChatEnabled = profile?.ai_chat_enabled ?? false;
  const aiChatConsentVersion = profile?.ai_chat_consent_version ?? null;
  const aiChatConsentedAt = profile?.ai_chat_consented_at ?? null;
  const hasCurrentConsent = aiChatConsentVersion === AI_CHAT_CONSENT_VERSION;
  const aiChatConsentRequired = !hasCurrentConsent;
  const isAiChatAllowed = aiChatEnabled && hasCurrentConsent;

  return {
    aiChatEnabled,
    aiChatConsentVersion,
    aiChatConsentedAt,
    aiChatConsentRequired,
    isAiChatAllowed
  };
}
