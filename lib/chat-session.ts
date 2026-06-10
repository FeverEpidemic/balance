import type { RekapPeriod } from "@/lib/chat-auth";

export type ChatIntent = "chat" | "recap";

export type UiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

export type StoredChatSession = {
  messages: UiChatMessage[];
  selectedPeriod: RekapPeriod;
  selectedWalletId: string;
  activeSuggestion?: string;
};

export type OutgoingChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const CHAT_STORAGE_KEY = "balance-ai-chat:v1";
export const MAX_CHAT_MESSAGES = 24;

export function buildChatRequestMessages(input: {
  history: UiChatMessage[];
  userMessage: UiChatMessage;
  intent: ChatIntent;
}) {
  const sourceMessages = input.intent === "recap" ? [input.userMessage] : [...input.history, input.userMessage];

  return sourceMessages.slice(-12).map((message) => ({
    role: message.role,
    content: message.content
  })) satisfies OutgoingChatMessage[];
}

export function sanitizeStoredChatSession(value: unknown): StoredChatSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<StoredChatSession>;
  const selectedPeriod = candidate.selectedPeriod;
  const selectedWalletId = typeof candidate.selectedWalletId === "string" ? candidate.selectedWalletId : "";
  const activeSuggestion = typeof candidate.activeSuggestion === "string" ? candidate.activeSuggestion : undefined;

  if (selectedPeriod !== "day" && selectedPeriod !== "week" && selectedPeriod !== "month") {
    return null;
  }

  if (!Array.isArray(candidate.messages)) {
    return null;
  }

  const messages = candidate.messages
    .filter((message): message is UiChatMessage => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const entry = message as Partial<UiChatMessage>;
      return (
        typeof entry.id === "string" &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string" &&
        (entry.isStreaming === undefined || typeof entry.isStreaming === "boolean")
      );
    })
    .map((message) => ({
      ...message,
      isStreaming: false
    }))
    .slice(-MAX_CHAT_MESSAGES);

  return {
    messages,
    selectedPeriod,
    selectedWalletId,
    activeSuggestion
  };
}
