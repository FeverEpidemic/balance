import { cookies } from "next/headers";
import { getAiClient, getAiModel, isAiChatAvailable } from "@/lib/ai/client";
import { getAiWalletOptions, getFinancialRecapForUser } from "@/lib/ai/data";
import { buildChatMessages, buildAiSystemPrompt } from "@/lib/ai/prompts";
import { aiTools, executeAiToolCall } from "@/lib/ai/tools";
import { requireUser } from "@/lib/auth";
import { type RekapPeriod } from "@/lib/chat-auth";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

type ChatRequestBody = {
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  walletId?: string;
  period?: RekapPeriod;
  locale?: string;
};

function createSseResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

function emitSse(encoder: TextEncoder, payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function createFriendlyFallbackStream(message: string) {
  return createSseResponse(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(emitSse(encoder, { type: "token", content: message }));
        controller.enqueue(emitSse(encoder, { type: "done" }));
        controller.close();
      }
    })
  );
}

export async function POST(request: Request) {
  const { user } = await requireUser();
  const cookieStore = await cookies();
  const body = (await request.json()) as ChatRequestBody;
  const locale = resolveLocale(body.locale ?? cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const period = body.period ?? "month";
  const walletId = body.walletId ?? null;
  const userMessages = (body.messages ?? []).filter((message) => message.content.trim().length > 0).slice(-12);

  if (!userMessages.length) {
    return createFriendlyFallbackStream(locale === "en" ? "Please write a question first." : "Tulis pertanyaan dulu, lalu saya bantu baca kondisi keuanganmu.");
  }

  if (!isAiChatAvailable()) {
    return createFriendlyFallbackStream(
      locale === "en"
        ? "AI chat is currently unavailable. Please try again after the DeepSeek configuration is enabled."
        : "Asisten AI sedang belum aktif. Coba lagi setelah konfigurasi DeepSeek diaktifkan."
    );
  }

  try {
    const [wallets, recap] = await Promise.all([
      getAiWalletOptions(user.id),
      getFinancialRecapForUser(user.id, period, walletId)
    ]);
    const systemPrompt = buildAiSystemPrompt({ recap, wallets, period });
    const client = getAiClient();

    if (!client) {
      throw new Error("AI_CLIENT_UNAVAILABLE");
    }

    const initialMessages = buildChatMessages(systemPrompt, userMessages);
    const conversationMessages: Parameters<typeof client.chat.completions.create>[0]["messages"] = [...initialMessages];

    for (let index = 0; index < 3; index += 1) {
      const completion = await client.chat.completions.create({
        model: getAiModel(),
        temperature: 0.4,
        messages: conversationMessages,
        tools: aiTools,
        tool_choice: "auto",
        stream: false
      });

      const choice = completion.choices[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) {
        break;
      }

      if (!assistantMessage.tool_calls?.length) {
        conversationMessages.push({
          role: "assistant",
          content: assistantMessage.content ?? ""
        });
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

    const stream = await client.chat.completions.create({
      model: getAiModel(),
      temperature: 0.5,
      messages: conversationMessages,
      stream: true
    });

    return createSseResponse(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;

              if (content) {
                controller.enqueue(emitSse(encoder, { type: "token", content }));
              }
            }

            controller.enqueue(emitSse(encoder, { type: "done" }));
            controller.close();
          } catch {
            controller.enqueue(
              emitSse(encoder, {
                type: "token",
                content:
                  locale === "en"
                    ? "A temporary issue happened while streaming the answer. Please try again in a moment."
                    : "Ada kendala sementara saat mengalirkan jawaban. Coba lagi sebentar lagi ya."
              })
            );
            controller.enqueue(emitSse(encoder, { type: "done" }));
            controller.close();
          }
        }
      })
    );
  } catch {
    return createFriendlyFallbackStream(
      locale === "en"
        ? "I couldn't prepare the AI answer right now. Please try again in a moment."
        : "Saya belum bisa menyiapkan jawaban AI sekarang. Coba lagi beberapa saat lagi ya."
    );
  }
}
