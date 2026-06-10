import "server-only";
import type { ChatCompletionMessageToolCall, ChatCompletionTool } from "openai/resources/chat/completions";
import { createTransactionViaAi, getBudgetStatusForUser, getCategoriesForWallets, getFinancialRecapForUser, getRecentTransactionsForUser } from "@/lib/ai/data";
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
  },
  {
    type: "function",
    function: {
      name: "getCategories",
      description: "Ambil daftar kategori yang bisa dipakai user, opsional difokuskan ke satu wallet.",
      parameters: {
        type: "object",
        properties: {
          walletId: {
            type: "string",
            description: "Opsional. Isi jika hanya perlu kategori dari satu wallet."
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createTransaction",
      description:
        "Catat transaksi baru setelah user secara eksplisit meminta atau mengonfirmasi pencatatan. Gunakan getCategories dulu jika kategori belum jelas.",
      parameters: {
        type: "object",
        properties: {
          walletId: {
            type: "string",
            description: "Wallet tujuan transaksi. Wajib."
          },
          kind: {
            type: "string",
            enum: ["income", "expense"]
          },
          amount: {
            type: "number",
            minimum: 1
          },
          categoryId: {
            type: "string",
            description: "Opsional. Gunakan ID kategori jika sudah diketahui."
          },
          categoryName: {
            type: "string",
            description: "Opsional. Nama kategori sebagai fallback jika ID belum tersedia."
          },
          note: {
            type: "string",
            description: "Opsional. Catatan transaksi singkat."
          },
          happenedAt: {
            type: "string",
            description: "Opsional. Format YYYY-MM-DD. Jika kosong, pakai hari ini."
          }
        },
        required: ["walletId", "kind", "amount"]
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
  try {
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
      case "getCategories":
        return JSON.stringify(
          await getCategoriesForWallets(userId, typeof args.walletId === "string" && args.walletId ? [args.walletId] : undefined)
        );
      case "createTransaction":
        return JSON.stringify(
          await createTransactionViaAi(userId, {
            walletId: String(args.walletId ?? ""),
            kind: args.kind === "income" ? "income" : "expense",
            amount: Number(args.amount),
            categoryId: typeof args.categoryId === "string" ? args.categoryId : null,
            categoryName: typeof args.categoryName === "string" ? args.categoryName : null,
            note: typeof args.note === "string" ? args.note : null,
            happenedAt: typeof args.happenedAt === "string" ? args.happenedAt : null
          })
        );
      default:
        return JSON.stringify({ error: "UNKNOWN_TOOL" });
    }
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : "TOOL_EXECUTION_FAILED",
      tool: toolCall.function.name
    });
  }
}
