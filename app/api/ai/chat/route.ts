import { cookies } from "next/headers";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { validateChatMessage } from "@/lib/ai/guard";
import { createAiChatCompletion, getAiClient, getAiModel, isAiChatAvailable, AiUpstreamRateLimitedError } from "@/lib/ai/client";
import { shouldReturnDirectAiReply } from "@/lib/ai/chat-response";
import { getAiWalletOptions, getCategoryFocusForUser, getFinancialRecapForUser } from "@/lib/ai/data";
import { buildFallbackFinanceAnswer, isLowSignalAiReply } from "@/lib/ai/fallback-response";
import { buildChatMessages, buildAiSystemPrompt } from "@/lib/ai/prompts";
import { buildDirectRecapMessage } from "@/lib/ai/recap-message";
import { aiTools, executeAiToolCall } from "@/lib/ai/tools";
import { requireUser } from "@/lib/auth";
import { type RekapPeriod } from "@/lib/chat-auth";
import { LOCALE_COOKIE_NAME, getTranslator, resolveLocale } from "@/lib/i18n";
import { applyRateLimitHeaders, consumeAiChatRateLimit } from "@/lib/rate-limit";

type ChatRequestBody = {
  intent?: "chat" | "recap";
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  walletId?: string;
  period?: RekapPeriod;
  locale?: string;
};

type ConversationMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ChatCompletionMessageToolCall[];
  tool_call_id?: string;
};

function createSseResponse(stream: ReadableStream, init?: ResponseInit) {
  return new Response(stream, {
    ...init,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...(init?.headers ?? {})
    }
  });
}

function emitSse(encoder: TextEncoder, payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function createFriendlyFallbackStream(message: string, init?: ResponseInit) {
  return createSseResponse(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(emitSse(encoder, { type: "token", content: message }));
        controller.enqueue(emitSse(encoder, { type: "done" }));
        controller.close();
      }
    }),
    init
  );
}

const TOOL_LOOP_MAX_ITERATIONS = 3;
const STREAM_READ_TIMEOUT_MS = 60_000;

export async function POST(request: Request) {
  const { user } = await requireUser();
  const cookieStore = await cookies();
  const body = (await request.json()) as ChatRequestBody;
  const locale = resolveLocale(body.locale ?? cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = getTranslator(locale);
  const period = body.period ?? "month";
  const walletId = body.walletId ?? null;
  const intent = body.intent ?? "chat";
  const recentMessages = (body.messages ?? []).filter((message) => message.content.trim().length > 0).slice(-12);
  const userMessages = recentMessages.filter((message) => message.role === "user");

  if (!userMessages.length) {
    return createFriendlyFallbackStream(t("chat.emptyPrompt"));
  }

  const aiRateLimit = await consumeAiChatRateLimit(user.id);

  if (!aiRateLimit.allowed) {
    return applyRateLimitHeaders(createFriendlyFallbackStream(t("ai.rateLimited"), { status: 429 }), aiRateLimit);
  }

  for (const message of userMessages) {
    const validation = validateChatMessage(message.content);

    if (!validation.ok) {
      const messageKey =
        validation.reason === "too_long"
          ? "chat.validationTooLong"
          : validation.reason === "unsafe"
            ? "chat.validationUnsafe"
            : "chat.validationOffTopic";

      return applyRateLimitHeaders(createFriendlyFallbackStream(t(messageKey), { status: 400 }), aiRateLimit);
    }
  }

  if (!isAiChatAvailable()) {
    return applyRateLimitHeaders(createFriendlyFallbackStream(t("chat.unavailable")), aiRateLimit);
  }

  try {
    const latestUserMessage = userMessages[userMessages.length - 1]?.content ?? "";
    const [wallets, recap, categoryFocus] = await Promise.all([
      getAiWalletOptions(user.id),
      getFinancialRecapForUser(user.id, period, walletId),
      getCategoryFocusForUser(user.id, period, latestUserMessage, walletId)
    ]);

    if (intent === "recap") {
      return applyRateLimitHeaders(createFriendlyFallbackStream(buildDirectRecapMessage(recap)), aiRateLimit);
    }

    const systemPrompt = buildAiSystemPrompt({ recap, wallets, period, latestUserMessage, categoryFocus });
    const client = getAiClient();

    if (!client) {
      throw new Error("AI_CLIENT_UNAVAILABLE");
    }

    const initialMessages = buildChatMessages(systemPrompt, recentMessages);
    const conversationMessages: ConversationMessage[] = [...initialMessages] as unknown as ConversationMessage[];
    let finalAssistantContent = "";
    let shouldStreamFinalReply = true;

    // Tool-call loop with retry/fallback on upstream failures
    try {
      for (let index = 0; index < TOOL_LOOP_MAX_ITERATIONS; index += 1) {
        const completion = await createAiChatCompletion(client, {
          model: getAiModel(),
          temperature: 0.4,
          // @ts-ignore - ConversationMessage vs ChatCompletionMessageParam discriminated union
          messages: conversationMessages,
          tools: aiTools,
          tool_choice: "auto",
          stream: false
        });

        const choice = (completion as { choices: Array<{ message?: { content?: string | null; tool_calls?: ChatCompletionMessageToolCall[] } | null }> }).choices[0];
        const assistantMessage = choice?.message;

        if (!assistantMessage) {
          break;
        }

        if (
          shouldReturnDirectAiReply({
            assistantContent: assistantMessage.content,
            hasToolCalls: Boolean(assistantMessage.tool_calls?.length)
          })
        ) {
          finalAssistantContent = assistantMessage.content?.trim() ?? "";
          shouldStreamFinalReply = false;
          conversationMessages.push({
            role: "assistant",
            content: finalAssistantContent
          });
          break;
        }

        if (!assistantMessage.tool_calls?.length) {
          finalAssistantContent = assistantMessage.content?.trim() ?? "";
          break;
        }

        conversationMessages.push({
          role: "assistant",
          content: assistantMessage.content ?? "",
          tool_calls: assistantMessage.tool_calls
        });

        for (const toolCall of assistantMessage.tool_calls) {
          const result = await executeAiToolCall(user.id, toolCall);
          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result
          });
        }
      }
    } catch (toolLoopError: unknown) {
      // Upstream failure during tool-call loop → fallback to local answer
      if (toolLoopError instanceof AiUpstreamRateLimitedError) {
        console.warn("[AI] tool-loop upstream rate limited, using local fallback");
      } else {
        console.warn("[AI] tool-loop upstream failed, using local fallback");
      }

      return applyRateLimitHeaders(
        createFriendlyFallbackStream(buildFallbackFinanceAnswer(latestUserMessage, recap, categoryFocus)),
        aiRateLimit
      );
    }

    if (!shouldStreamFinalReply && finalAssistantContent) {
      const responseText = isLowSignalAiReply(finalAssistantContent)
        ? buildFallbackFinanceAnswer(latestUserMessage, recap, categoryFocus)
        : finalAssistantContent;

      return applyRateLimitHeaders(createFriendlyFallbackStream(responseText), aiRateLimit);
    }

    // Streaming final reply — with retry wrapper and read timeout
    try {
      const stream = await createAiChatCompletion(client, {
        model: getAiModel(),
        temperature: 0.5,
        // @ts-expect-error - ConversationMessage vs ChatCompletionMessageParam discriminated union
        messages: conversationMessages,
        stream: true
      });

      const response = createSseResponse(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            let streamTimedOut = false;
            const streamTimeoutId = setTimeout(() => {
              streamTimedOut = true;
              controller.enqueue(
                emitSse(encoder, {
                  type: "streamTimeout"
                })
              );
              controller.enqueue(emitSse(encoder, { type: "done" }));
              try {
                controller.close();
              } catch {
                // Controller may already be closed
              }
            }, STREAM_READ_TIMEOUT_MS);

            try {
              for await (const chunk of stream as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }> }>) {
                if (streamTimedOut) {
                  break;
                }

                const content = chunk.choices[0]?.delta?.content;

                if (content) {
                  controller.enqueue(emitSse(encoder, { type: "token", content }));
                }
              }

              if (!streamTimedOut) {
                clearTimeout(streamTimeoutId);
                controller.enqueue(emitSse(encoder, { type: "done" }));
                controller.close();
              }
            } catch {
              clearTimeout(streamTimeoutId);

              if (!streamTimedOut) {
                controller.enqueue(
                  emitSse(encoder, {
                    type: "token",
                    content: t("chat.streamFailed")
                  })
                );
                controller.enqueue(emitSse(encoder, { type: "done" }));
                controller.close();
              }
            }
          }
        })
      );

      return applyRateLimitHeaders(response, aiRateLimit);
    } catch (streamCreateError: unknown) {
      // Streaming creation failed — fallback to local answer
      if (streamCreateError instanceof AiUpstreamRateLimitedError) {
        console.warn("[AI] stream creation upstream rate limited, using local fallback");
      } else {
        console.warn("[AI] stream creation upstream failed, using local fallback");
      }

      return applyRateLimitHeaders(
        createFriendlyFallbackStream(buildFallbackFinanceAnswer(latestUserMessage, recap, categoryFocus)),
        aiRateLimit
      );
    }
  } catch (error: unknown) {
    // Unexpected error (e.g. AI_CLIENT_UNAVAILABLE, data layer failure)
    console.warn("[AI] unexpected error in chat route", (error as Error)?.message ?? error);
    return applyRateLimitHeaders(createFriendlyFallbackStream(t("chat.prepareFailed")), aiRateLimit);
  }
}
