import { cookies } from "next/headers";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { validateChatMessage } from "@/lib/ai/guard";
import { getAiChatComplianceState } from "@/lib/ai/compliance";
import { createAiChatCompletion, getAiClient, getAiModel, isAiChatAvailable, AiUpstreamRateLimitedError } from "@/lib/ai/client";
import { shouldReturnDirectAiReply } from "@/lib/ai/chat-response";
import {
  buildBudgetedConversation,
  exceedsPreflightCompactBudget,
  shouldStopToolCallsForBudget,
  toOpenAiMessages
} from "@/lib/ai/chat-budget";
import { getAiWalletOptions, getCategoryFocusForUser, getFinancialRecapForUser, type AiCategoryFocus, type AiWalletOption } from "@/lib/ai/data";
import { cachedAiRecap, cachedAiWalletOptions } from "@/lib/ai/cache";
import { buildFallbackFinanceAnswer, isLowSignalAiReply } from "@/lib/ai/fallback-response";
import { buildAiSystemPrompt } from "@/lib/ai/prompts";
import { shouldForceTransactionToolCall } from "@/lib/ai/read-intent";
import { buildDirectRecapMessage } from "@/lib/ai/recap-message";
import { analyzeConversationToolResults, resolveBlockingToolErrorMessage } from "@/lib/ai/tool-result";
import { aiTools, executeAiToolCall } from "@/lib/ai/tools";
import { requireUser } from "@/lib/auth";
import { type RekapPeriod } from "@/lib/chat-auth";
import { formatCurrency, getTodayDateString } from "@/lib/utils";
import { LOCALE_COOKIE_NAME, getTranslator, resolveLocale } from "@/lib/i18n";
import { applyDailyLimitHeaders, applyRateLimitHeaders, consumeAiChatDailyLimit, consumeAiChatRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { getPlanPolicy } from "@/lib/plan";
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

const MUTATION_KEYWORDS = [
  "catat", "catet", "simpan", "buatkan transaksi", "record", "tambah transaksi",
  "input transaksi", "masukkan transaksi", "buat budget", "set budget",
  "atur budget", "anggaran", "ubah budget", "update budget", "hapus budget",
  "delete budget", "konfirmasi", "confirm", "naikin budget", "turunin budget"
];

export function isMutationLikeMessage(message: string) {
  const normalized = message.toLocaleLowerCase("id-ID");
  return MUTATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

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
  const { user, supabase } = await requireUser();
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("ai_chat_enabled, ai_chat_consent_version, ai_chat_consented_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.warn("[AI] failed to load profile compliance state", profileError.message);
    return createFriendlyFallbackStream(t("chat.prepareFailed"), { status: 500 });
  }

  const aiCompliance = getAiChatComplianceState(profile);

  if (!aiCompliance.isAiChatAllowed) {
    return createFriendlyFallbackStream(t("chat.consentRequired"), { status: 403 });
  }

  // Plan-aware daily limit: premium users skip the daily cap entirely.
  const planPolicy = await getPlanPolicy(user.id);
  const aiDailyLimit = planPolicy.aiChatDailyLimit === null
    ? { allowed: true, limit: Infinity, remaining: Infinity, resetAt: 0, usedRedis: false } satisfies RateLimitResult
    : await consumeAiChatDailyLimit(user.id);

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

  let tStart = 0;

  try {
    tStart = Date.now();
    console.log(`[AI][timing] stage=auth_limits_ms duration=0 userId=${user.id.slice(0, 8)}...`); // anchor: guard rails before try
    const latestUserMessage = userMessages[userMessages.length - 1]?.content ?? "";
    const todayDate = getTodayDateString();
    const tokenBudget = getAiChatTokenBudget();

    if (exceedsPreflightCompactBudget({ messages: recentMessages, tokenBudget })) {
      return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(t("chat.validationTooLong"), { status: 400 }), aiRateLimit), aiDailyLimit);
    }

    // ── Preload data with caching ─────────────────────────────────
    const recap = await cachedAiRecap(user.id, period, walletId, () =>
      getFinancialRecapForUser(user.id, period, walletId)
    );
    const tPreload = Date.now();
    console.log(`[AI][timing] stage=preload_ms duration=${tPreload - tStart} userId=${user.id.slice(0, 8)}...`);

    // Wallet options: fetch only when walletId is not specified (needs wallet picker)
    // Cached with 30s TTL so repeated queries are cheap
    let wallets: AiWalletOption[];
    if (walletId) {
      // Single wallet context — still use cache, lightest path after first hit
      wallets = await cachedAiWalletOptions(user.id, () => getAiWalletOptions(user.id));
    } else {
      wallets = await cachedAiWalletOptions(user.id, () => getAiWalletOptions(user.id));
    }

    // Category focus: attempt against all accessible categories so income and non-top categories still resolve
    let categoryFocus: AiCategoryFocus | null = null;
    if (latestUserMessage.trim()) {
      categoryFocus = await getCategoryFocusForUser(user.id, period, latestUserMessage, walletId);
    }

    const tData = Date.now();
    console.log(`[AI][timing] stage=data_load_ms duration=${tData - tPreload} userId=${user.id.slice(0, 8)}...`);

    if (intent === "recap") {
      const recapSummary = buildRunningSummary(recap, "rekap");
      return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(buildDirectRecapMessage(recap), undefined, recapSummary), aiRateLimit), aiDailyLimit);
    }

    const tPromptStart = Date.now();
    const fullSystemPrompt = buildAiSystemPrompt({ recap, wallets, period, latestUserMessage, categoryFocus, todayDate, runningSummary: runningSummary || undefined });
    const compactSystemPrompt = buildAiSystemPrompt({ recap, wallets, period, latestUserMessage, categoryFocus, todayDate, compact: true, runningSummary: runningSummary || undefined });
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

    const tBudgetEnd = Date.now();
    console.log(`[AI][timing] stage=prompt_build_ms duration=${tBudgetEnd - tPromptStart} userId=${user.id.slice(0, 8)}...`);

    const client = getAiClient();

    if (!client) {
      throw new Error("AI_CLIENT_UNAVAILABLE");
    }

    const conversationMessages: ConversationMessage[] = [...initialBudgetedConversation.conversationMessages];
    let finalAssistantContent = "";
    let shouldStreamFinalReply = true;
    let stopToolLoopForBudget = false;

    // ── Mutation detection for fast path + tool-loop limits ──────
    const mightBeMutation = isMutationLikeMessage(latestUserMessage);

    // Fast path: skip tool loop entirely for read-only simple questions
    // Only activates when no mutation keywords, no pending confirmation context
    const hasConfirmationContext = recentMessages.some(
      (m) => m.role === "assistant" && (m.content.includes("konfirmasi") || m.content.includes("preview") || m.content.includes("NEEDS_CONFIRMATION"))
    );
    const needsTransactionReadTool = shouldForceTransactionToolCall(latestUserMessage);
    const isFastPathEligible = !mightBeMutation && !hasConfirmationContext && !needsTransactionReadTool;

    if (isFastPathEligible) {
      console.log(`[AI][timing] fast_path_active userId=${user.id.slice(0, 8)}...`);
    }

    const maxIterations = mightBeMutation ? 3 : 1;

    // Tool-call loop with retry/fallback on upstream failures
    // Fast-path: skip entirely for read-only queries
    try {
      if (isFastPathEligible) {
        // No tool calls needed — jump directly to streaming final reply
        finalAssistantContent = "";
        shouldStreamFinalReply = true;
      } else {
        for (let index = 0; index < maxIterations; index += 1) {
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
      }

      const tToolLoopEnd = Date.now();
      if (!isFastPathEligible) {
        console.log(`[AI][timing] stage=tool_loop_ms duration=${tToolLoopEnd - tBudgetEnd} iterations=${maxIterations} userId=${user.id.slice(0, 8)}...`);
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

    // After tool loop: tool payloads become the source of truth for mutation flows.
    const toolResultAnalysis = analyzeConversationToolResults(conversationMessages);

    if (toolResultAnalysis.status === "confirmation_required") {
      const needsConfirmationResult = toolResultAnalysis.confirmation;
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

    if (toolResultAnalysis.status === "blocking_error") {
      const blockingSummary = buildRunningSummary(recap, action);
      const blockingMessage = resolveBlockingToolErrorMessage(toolResultAnalysis.blockingError, t);
      return applyDailyLimitHeaders(applyRateLimitHeaders(
        createFriendlyFallbackStream(blockingMessage, undefined, blockingSummary),
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

    const finalToolResultAnalysis = analyzeConversationToolResults(conversationMessages);
    if (finalToolResultAnalysis.status === "blocking_error") {
      const guardedSummary = buildRunningSummary(recap, action);
      const guardedMessage = resolveBlockingToolErrorMessage(finalToolResultAnalysis.blockingError, t);
      return applyDailyLimitHeaders(applyRateLimitHeaders(
        createFriendlyFallbackStream(guardedMessage, undefined, guardedSummary),
        aiRateLimit
      ), aiDailyLimit);
    }

    // Streaming final reply — with retry wrapper and read timeout
    try {
      const stream = await createAiChatCompletion(client, {
        model: getAiModel(),
        temperature: 0.5,
        messages: toOpenAiMessages(conversationMessages),
        stream: true
      });
      const tStreamCreate = Date.now();
      console.log(`[AI][timing] stage=stream_create_ms duration=${tStreamCreate - tBudgetEnd} userId=${user.id.slice(0, 8)}...`);

      const response = createSseResponse(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            let streamTimedOut = false;
            let firstTokenLogged = false;
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
                  if (!firstTokenLogged) {
                    firstTokenLogged = true;
                    console.log(`[AI][timing] stage=first_token_ms duration=${Date.now() - tBudgetEnd} userId=${user.id.slice(0, 8)}...`);
                  }
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
                console.log(`[AI][timing] stage=total_ms duration=${Date.now() - tStart} userId=${user.id.slice(0, 8)}...`);
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
      console.log(`[AI][timing] stage=total_ms duration=${Date.now() - tStart} userId=${user.id.slice(0, 8)}... error=stream_create_failed`);
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
    console.log(`[AI][timing] stage=total_ms duration=${Date.now() - tStart} userId=${user.id.slice(0, 8)}... error=unexpected`);
    // Unexpected error (e.g. AI_CLIENT_UNAVAILABLE, data layer failure)
    console.warn("[AI] unexpected error in chat route", (error as Error)?.message ?? error);
    return applyDailyLimitHeaders(applyRateLimitHeaders(createFriendlyFallbackStream(t("chat.prepareFailed")), aiRateLimit), aiDailyLimit);
  }
}
