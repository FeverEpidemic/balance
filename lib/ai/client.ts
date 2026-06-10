import "server-only";
import OpenAI from "openai";
import { getAiChatEnabled, getAiChatModel, getDeepseekApiKey, getDeepseekBaseUrl } from "@/lib/env";

let cachedClient: OpenAI | null | undefined;

export function getAiClient() {
  if (!getAiChatEnabled()) {
    return null;
  }

  const apiKey = getDeepseekApiKey();

  if (!apiKey) {
    return null;
  }

  if (cachedClient !== undefined) {
    return cachedClient;
  }

  cachedClient = new OpenAI({
    apiKey,
    baseURL: getDeepseekBaseUrl()
  });

  return cachedClient;
}

export function getAiModel() {
  return getAiChatModel();
}

export function isAiChatAvailable() {
  return Boolean(getAiClient());
}
