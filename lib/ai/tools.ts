import "server-only";
import type { ChatCompletionMessageToolCall, ChatCompletionTool } from "openai/resources/chat/completions";
import { getBudgetStatusForUser, getFinancialRecapForUser, getRecentTransactionsForUser } from "@/lib/ai/data";
import type { RekapPeriod } from "@/lib/chat-auth";

export const aiTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getFinancialRecap",
      description: "Ambil rekap keuangan user untuk periode day, week, atau month.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["day", "week", "month"]
          },
          walletId: {
            type: "string",
            description: "Opsional. Isi jika perlu fokus ke satu wallet."
          }
        },
        required: ["period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getTransactions",
      description: "Ambil daftar transaksi terbaru untuk user, opsional per wallet.",
      parameters: {
        type: "object",
        properties: {
          walletId: {
            type: "string"
          },
          limit: {
            type: "number",
            minimum: 1,
            maximum: 20
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getBudgetStatus",
      description: "Ambil status anggaran bulan berjalan untuk sebuah wallet.",
      parameters: {
        type: "object",
        properties: {
          walletId: {
            type: "string"
          }
        },
        required: ["walletId"]
      }
    }
  }
];

function parseArguments(rawArguments: string) {
  try {
    return JSON.parse(rawArguments) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function executeAiToolCall(userId: string, toolCall: ChatCompletionMessageToolCall) {
  if (toolCall.type !== "function") {
    return JSON.stringify({ error: "UNSUPPORTED_TOOL_CALL" });
  }

  const args = parseArguments(toolCall.function.arguments);

  switch (toolCall.function.name) {
    case "getFinancialRecap":
      return JSON.stringify(
        await getFinancialRecapForUser(
          userId,
          ((args.period as RekapPeriod | undefined) ?? "month"),
          (args.walletId as string | undefined) ?? null
        )
      );
    case "getTransactions":
      return JSON.stringify(
        await getRecentTransactionsForUser(userId, (args.walletId as string | undefined) ?? null, Number(args.limit) || 8)
      );
    case "getBudgetStatus":
      return JSON.stringify(await getBudgetStatusForUser(userId, String(args.walletId ?? "")));
    default:
      return JSON.stringify({ error: "UNKNOWN_TOOL" });
  }
}
