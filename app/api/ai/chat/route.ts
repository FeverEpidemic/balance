import { cookies } from "next/headers";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { validateChatMessage } from "@/lib/ai/guard";
import { createAiChatCompletion, getAiClient, getAiModel, isAiChatAvailable, AiUpstreamRateLimitedError } from "@/lib/ai/client";
import { shouldReturnDirectAiReply } from "@/lib/ai/chat-response";
import {
  buildBudgetedConversation,
  exceedsPreflightCompactBudget,
  shouldStopToolCallsForBudget,
  toOpenAiMessages
} from "@/lib/ai/chat-budget";
import { getAiWalletOptions, getCategoryFocusForUser, getFinancialRecapForUser } from "@/lib/ai/data";
import { buildFallbackFinanceAnswer, isLowSignalAiReply } from "@/lib/ai/fallback-response";
import { buildAiSystemPrompt } from "@/lib/ai/prompts";
import { buildDirectRecapMessage } from "@/lib/ai/recap-message";
import { aiTools, executeAiToolCall } from "@/lib/ai/tools";
import { requireUser } from "@/lib/auth";
import { type RekapPeriod } from "@/lib/chat-auth";
import { formatCurrency } from "@/lib/utils";
import { LOCALE_COOKIE_NAME, getTranslator, resolveLocale } from "@/lib/i18n";
import { applyDailyLimitHeaders, applyRateLimitHeaders, consumeAiChatDailyLimit, consumeAiChatRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { budgetConversationMessages, estimateConversationTokens } from "@/lib/ai/token-budget";
import { getAiChatTokenBudget } from "@/lib/env";

type ChatRequestBody = {
  intent?: "chat" | "recap";
  action?: string;
  runningSummary?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string; score?: number }>;
  walletId?: string;
  period?: RekapPeriod;
  locale?: string;
};

type ConversationMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: unknown;
  tool_call_id?: string;
  relevanceScore?: number;
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

function createFriendlyFallbackStream(message: string, init?: ResponseInit, runningSummary?: string) {
  return createSseResponse(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(emitSse(encoder, { type: "token", content: message }));
        if (runningSummary) {
          controller.enqueue(emitSse(encoder, { type: "runningSummary", content: runningSummary }));
        }
        controller.enqueue(emitSse(encoder, { type: "done" }));
        controller.close();
      }
    }),
    init
  );
}

const TOOL_LOOP_MAX_ITERATIONS = 3;
const STREAM_READ_TIMEOUT_MS = 60_000;

/**
 * Builds a compact running summary of the current financial context.
 * This gets stored on the client and included in subsequent turn's system prompt.
 */
function buildRunningSummary(recap: {
  period: RekapPeriod;
  walletLabel: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  topExpenseCategories: Array<{ categoryId: string | null; categoryName: string; total: number }>;
}, action: string): string {
  const top = recap.topExpenseCategories.slice(0, 3);
  const topSummary = top.length > 0
    ? `Pengeluaran teratas: ${top.map((c) => `${c.categoryName} ${formatCurrency(c.total)}`).join(", ")}.`
    : "Belum ada transaksi.";
  return `Periode ${recap.period} — ${recap.walletLabel}: pemasukan ${formatCurrency(recap.totalIncome)}, pengeluaran ${formatCurrency(recap.totalExpense)}, net ${formatCurrency(recap.net)}, ${recap.transactionCount} transaksi. ${topSummary} Aksi terakhir: ${action}.`;
}

export async function POST(request: Request) {
  const { user } = await requireUser();
  const cookieStore = await cookies();
  const body = (await request.json()) as ChatRequestBody;
  const locale = resolveLocale(body.locale ?? cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = getTranslator(locale);
  const period = body.period ?? "month";
  const walletId = body.walletId ?? null;
  const intent = body.intent ?? "chat";
  const action = body.action ?? "general";
  const runningSummary = body.runningSummary ?? "";
  const recentMessages = (body.messages ?? []).filter((message) => message.content.trim().length > 0).slice(-12);
  const userMessages = recentMessages.filter((message) => message.role === "user");

  if (!userMessages.length) {
    return createFriendlyFallbackStream(t("chat.emptyPrompt"));
  }

  const aiDailyLimit = await consumeAiChatDailyLimit(user.id);

  if (!aiDailyLimit.allowed) {
    return applyDailyLimitHeaders(createFriendlyFallbackStream(t("ai.dailyRateLimited"), { status: 429 }), aiDailyLimit);
  }

  const aiRateLimit = await consumeAiChatRateLimit(user.id);

  if (!aiRateLimit.allowed) {
    return applyRateLimitHeaders(applyDailyLimitHeaders(createFriendlyFallbackStream(t("ai.rateLimited"), { status: 429 }), aiDailyLimit), aiRateLimit);
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

      return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(t(messageKey), { status: 400 }), aiRateLimit), aiDailyLimit);
    }
  }

  if (!isAiChatAvailable()) {
    return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(t("chat.unavailable")), aiRateLimit), aiDailyLimit);
  }

  try {
    const latestUserMessage = userMessages[userMessages.length - 1]?.content ?? "";
    const tokenBudget = getAiChatTokenBudget();

    if (exceedsPreflightCompactBudget({ messages: recentMessages, tokenBudget })) {
      return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(t("chat.validationTooLong"), { status: 400 }), aiRateLimit), aiDailyLimit);
    }

    const [wallets, recap, categoryFocus] = await Promise.all([
      getAiWalletOptions(user.id),
      getFinancialRecapForUser(user.id, period, walletId),
      getCategoryFocusForUser(user.id, period, latestUserMessage, walletId)
    ]);

    if (intent === "recap") {
      const recapSummary = buildRunningSummary(recap, "rekap");
      return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(buildDirectRecapMessage(recap), undefined, recapSummary), aiRateLimit), aiDailyLimit);
    }

    const fullSystemPrompt = buildAiSystemPrompt({ recap, wallets, period, latestUserMessage, categoryFocus, runningSummary: runningSummary || undefined });
    const compactSystemPrompt = buildAiSystemPrompt({ recap, wallets, period, latestUserMessage, categoryFocus, compact: true, runningSummary: runningSummary || undefined });
    const initialBudgetedConversation = buildBudgetedConversation({
      systemPrompt: fullSystemPrompt,
      compactSystemPrompt,
      messages: recentMessages,
      tokenBudget
    });

    if (initialBudgetedConversation.usedCompactPrompt) {
      console.warn(`[AI] token budget exceeded, switching to compact system prompt (${initialBudgetedConversation.estimatedTokens}/${tokenBudget})`);
    }

    if (initialBudgetedConversation.wasTrimmed) {
      console.warn(`[AI] conversation still large after compact prompt, trimming low-relevance history (${initialBudgetedConversation.estimatedTokens}/${tokenBudget})`);
    }

    const client = getAiClient();

    if (!client) {
      throw new Error("AI_CLIENT_UNAVAILABLE");
    }

    const conversationMessages: ConversationMessage[] = [...initialBudgetedConversation.conversationMessages];
    let finalAssistantContent = "";
    let shouldStreamFinalReply = true;
    let stopToolLoopForBudget = false;

    // Tool-call loop with retry/fallback on upstream failures
    try {
      for (let index = 0; index < TOOL_LOOP_MAX_ITERATIONS; index += 1) {
        const completion = await createAiChatCompletion(client, {
          model: getAiModel(),
          temperature: 0.4,
          messages: toOpenAiMessages(conversationMessages),
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
          const result = await executeAiToolCall(user.id, toolCall, { userMessage: latestUserMessage });
          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result
          });

          if (shouldStopToolCallsForBudget({ messages: conversationMessages, tokenBudget })) {
            stopToolLoopForBudget = true;
            break;
          }
        }

        if (stopToolLoopForBudget) {
          break;
        }
      }
    } catch (toolLoopError: unknown) {
      // Upstream failure during tool-call loop → fallback to local answer
      if (toolLoopError instanceof AiUpstreamRateLimitedError) {
        console.warn("[AI] tool-loop upstream rate limited, using local fallback");
      } else {
        console.warn("[AI] tool-loop upstream failed, using local fallback");
      }

      const fallbackSummary = buildRunningSummary(recap, "analisis");
      return applyDailyLimitHeaders(applyRateLimitHeaders(
        createFriendlyFallbackStream(buildFallbackFinanceAnswer(latestUserMessage, recap, categoryFocus), undefined, fallbackSummary),
        aiRateLimit
      ), aiDailyLimit);
    }

    // After tool loop: check for NEEDS_CONFIRMATION and emit SSE directly
    const needsConfirmationResult = (() => {
      const toolResults = conversationMessages.filter((msg) => msg.role === "tool");
      for (const toolResult of toolResults) {
        try {
          const parsed = JSON.parse(toolResult.content) as Record<string, unknown>;
          if (parsed.code === "NEEDS_CONFIRMATION") {
            return parsed as {
              code: string;
              confidence: { score: number; tier: string; reasons: string[]; flags: string[] };
              preview: {
                walletId: string;
                kind: string;
                amount: number;
                categoryId?: string | null;
                categoryName?: string | null;
                note?: string | null;
                happenedAt?: string | null;
              };
            };
          }
        } catch {
          // skip unparseable results
        }
      }
      return null;
    })();

    if (needsConfirmationResult) {
      const confirmSummary = buildRunningSummary(recap, `konfirmasi transaksi: ${formatCurrency(needsConfirmationResult.preview.amount)} (${needsConfirmationResult.preview.kind})`);
      return applyDailyLimitHeaders(applyRateLimitHeaders(
        createSseResponse(
          new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(
                emitSse(encoder, {
                  type: "transactionPreview",
                  confidence: needsConfirmationResult.confidence.score,
                  preview: needsConfirmationResult.preview
                })
              );
              if (confirmSummary) {
                controller.enqueue(emitSse(encoder, { type: "runningSummary", content: confirmSummary }));
              }
              controller.enqueue(emitSse(encoder, { type: "done" }));
              controller.close();
            }
          })
        ),
        aiRateLimit
      ), aiDailyLimit);
    }

    if (!shouldStreamFinalReply && finalAssistantContent) {
      const responseText = isLowSignalAiReply(finalAssistantContent)
        ? buildFallbackFinanceAnswer(latestUserMessage, recap, categoryFocus)
        : finalAssistantContent;
      const directSummary = buildRunningSummary(recap, action);

      return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(responseText, undefined, directSummary), aiRateLimit), aiDailyLimit);
    }

    // ── Final budget check before streaming ─────────────────────────
    {
      const finalTokens = estimateConversationTokens(conversationMessages, {
        includeToolDefinitions: true
      });
      if (finalTokens > tokenBudget) {
        console.warn(`[AI] final conversation over budget (${finalTokens} > ${tokenBudget}), trimming before streaming`);
        const trimmed = budgetConversationMessages(conversationMessages, tokenBudget, {
          includeToolDefinitions: true
        });
        conversationMessages.length = 0;
        conversationMessages.push(...trimmed);
      }
    }
    // ── End final budget check ─────────────────────────────────────

    // Streaming final reply — with retry wrapper and read timeout
    try {
      const stream = await createAiChatCompletion(client, {
        model: getAiModel(),
        temperature: 0.5,
        messages: toOpenAiMessages(conversationMessages),
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
                const streamSummary = buildRunningSummary(recap, action);
                if (streamSummary) {
                  controller.enqueue(emitSse(encoder, { type: "runningSummary", content: streamSummary }));
                }
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

      return applyDailyLimitHeaders(applyRateLimitHeaders(response, aiRateLimit), aiDailyLimit);
    } catch (streamCreateError: unknown) {
      // Streaming creation failed — fallback to local answer
      if (streamCreateError instanceof AiUpstreamRateLimitedError) {
        console.warn("[AI] stream creation upstream rate limited, using local fallback");
      } else {
        console.warn("[AI] stream creation upstream failed, using local fallback");
      }

      const streamCreateSummary = buildRunningSummary(recap, action);
      return applyDailyLimitHeaders(applyRateLimitHeaders(
        createFriendlyFallbackStream(buildFallbackFinanceAnswer(latestUserMessage, recap, categoryFocus), undefined, streamCreateSummary),
        aiRateLimit
      ), aiDailyLimit);
    }
  } catch (error: unknown) {
    // Unexpected error (e.g. AI_CLIENT_UNAVAILABLE, data layer failure)
    console.warn("[AI] unexpected error in chat route", (error as Error)?.message ?? error);
    return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(t("chat.prepareFailed")), aiRateLimit), aiDailyLimit);
  }
}
