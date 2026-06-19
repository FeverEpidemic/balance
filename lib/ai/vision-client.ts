import "server-only";
import OpenAI from "openai";
import { getVisionEnabled, getVisionApiKey, getVisionBaseUrl, getVisionModel } from "@/lib/env";

let cachedVisionClient: OpenAI | null | undefined;

/**
 * Returns a dedicated OpenAI client for vision API calls.
 * Completely separate from the DeepSeek chat AI client.
 * Returns null if vision is disabled or no API key is configured.
 */
export function getVisionClient(): OpenAI | null {
  if (!getVisionEnabled()) return null;
  const apiKey = getVisionApiKey();
  if (!apiKey) return null;

  if (cachedVisionClient !== undefined) return cachedVisionClient;

  cachedVisionClient = new OpenAI({
    apiKey,
    baseURL: getVisionBaseUrl(),
  });

  return cachedVisionClient;
}

/** Quick check whether the vision client is available. */
export function isVisionAvailable(): boolean {
  return Boolean(getVisionClient());
}

/** Returns the vision model name for API calls. */
export function getVisionModelName(): string {
  return getVisionModel();
}
