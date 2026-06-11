import "server-only";
import OpenAI from "openai";
import {
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  InternalServerError,
  RateLimitError
} from "openai/error";
import type { ChatCompletionCreateParams } from "openai/resources/chat/completions";
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

// ── Retry & timeout helpers ──────────────────────────────────────────────

export class AiUpstreamFailedError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "AiUpstreamFailedError";
  }
}

export class AiUpstreamRateLimitedError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "AiUpstreamRateLimitedError";
  }
}

const MAX_RETRIES = 2; // total 3 attempts
const BASE_DELAY_MS = 1_000;
const NON_STREAMING_TIMEOUT_MS = 30_000;
const STREAMING_TIMEOUT_MS = 60_000;

function isRetryableError(error: unknown): boolean {
  return (
    error instanceof RateLimitError ||
    error instanceof InternalServerError ||
    error instanceof APIConnectionError ||
    error instanceof APIConnectionTimeoutError
  );
}

function parseRetryAfter(headers: Headers | undefined): number | null {
  if (!headers) {
    return null;
  }

  const raw = headers.get("retry-after");

  if (!raw) {
    return null;
  }

  const seconds = Number(raw);

  if (Number.isInteger(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  return null;
}

async function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an AI chat completion with retry, backoff, temperature escalation,
 * upstream 429 parsing, and explicit per-request timeout.
 *
 * Non-streaming: 30 s timeout, temperature escalates +0.1 per retry (capped 1.0).
 * Streaming:     60 s timeout, temperature is not re-escalated.
 */
export async function createAiChatCompletion(
  client: OpenAI,
  params: ChatCompletionCreateParams
): Promise<unknown> {
  // Returns ChatCompletion (non-streaming) or Stream<ChatCompletionChunk> (streaming)
  // We use unknown because the overloaded return type is complex to express statically.
  const isStreaming = params.stream === true;
  const timeoutMs = isStreaming ? STREAMING_TIMEOUT_MS : NON_STREAMING_TIMEOUT_MS;
  const baseTemperature = "temperature" in params ? (params as { temperature?: number }).temperature : undefined;

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const attemptParams = { ...params } as ChatCompletionCreateParams & { temperature?: number };

      // Escalate temperature on retry for non-streaming calls
      if (!isStreaming && attempt > 0 && baseTemperature !== undefined) {
        attemptParams.temperature = Math.min(baseTemperature + attempt * 0.1, 1.0);
      }

      // Per-request timeout via AbortSignal
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const result = await client.chat.completions.create(attemptParams, {
          signal: controller.signal
        });

        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: unknown) {
      lastError = error;

      // Log upstream error for observability (no secrets in log)
      if (error instanceof APIError) {
        console.warn(
          `[AI] upstream error attempt=${attempt + 1}/${MAX_RETRIES + 1} status=${error.status} message=${(error as Error).message}`
        );
      } else if (error instanceof Error && error.name === "AbortError") {
        console.warn(`[AI] upstream timeout attempt=${attempt + 1}/${MAX_RETRIES + 1} timeoutMs=${timeoutMs}`);
        lastError = new APIConnectionTimeoutError({ message: `Request timed out after ${timeoutMs}ms` });
      } else {
        console.warn(
          `[AI] upstream error attempt=${attempt + 1}/${MAX_RETRIES + 1} message=${(error as Error)?.message ?? "unknown"}`
        );
      }

      if (!isRetryableError(lastError) || attempt === MAX_RETRIES) {
        break;
      }

      // If upstream returned 429 with Retry-After, honour it
      if (lastError instanceof RateLimitError) {
        const retryAfterMs = parseRetryAfter((lastError as APIError).headers);

        if (retryAfterMs) {
          console.warn(`[AI] upstream 429 retry-after=${retryAfterMs}ms`);

          if (attempt === MAX_RETRIES - 1) {
            // This is the last retry — no point waiting, throw now
            throw new AiUpstreamRateLimitedError(
              `AI upstream rate limited: ${(lastError as Error).message}`,
              retryAfterMs / 1000
            );
          }

          await delayMs(retryAfterMs);
          continue;
        }

        // No Retry-After header — still retry with backoff, but on last retry throw typed error
        if (attempt === MAX_RETRIES - 1) {
          const backoffMs = BASE_DELAY_MS * Math.pow(2, attempt);
          await delayMs(backoffMs);

          // One final attempt after backoff
          continue;
        }
      }

      // Exponential backoff
      const backoffMs = BASE_DELAY_MS * Math.pow(2, attempt);
      await delayMs(backoffMs);
    }
  }

  if (lastError instanceof RateLimitError) {
    throw new AiUpstreamRateLimitedError(
      `AI upstream rate limited after ${MAX_RETRIES + 1} attempts: ${(lastError as Error).message}`,
      parseRetryAfter((lastError as APIError).headers) ?? undefined
    );
  }

  throw new AiUpstreamFailedError(
    `AI upstream failed after ${MAX_RETRIES + 1} attempts: ${(lastError as Error)?.message ?? "unknown error"}`,
    lastError instanceof Error ? lastError : undefined
  );
}
