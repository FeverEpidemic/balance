import "server-only";
import type { ChatCompletionMessageToolCall, ChatCompletionTool } from "openai/resources/chat/completions";
import { createTransactionViaAi, getBudgetStatusForUser, getCategoriesForWallets, getFinancialRecapForUser, getRecentTransactionsForUser } from "@/lib/ai/data";
import { checkDailySpendingCap, checkDuplicateTransaction, computeTransactionConfidence, resolveWalletName } from "@/lib/ai/confidence";
import type { AiCreateTransactionParams } from "@/lib/ai/data";
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
            minLength: 1,
            description: "Wallet tujuan transaksi. Wajib diisi, tidak boleh kosong."
          },
          kind: {
            type: "string",
            enum: ["income", "expense"],
            description: "Jenis transaksi: income untuk pemasukan, expense untuk pengeluaran."
          },
          amount: {
            type: "number",
            minimum: 1,
            description: "Nominal transaksi dalam Rupiah. Harus bilangan positif (> 0)."
          },
          categoryId: {
            type: "string",
            description: "Opsional. Gunakan ID kategori jika sudah diketahui dari getCategories."
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
            description: "Opsional. Tanggal transaksi dalam format YYYY-MM-DD. Jika kosong, pakai tanggal hari ini."
          }
        },
        required: ["walletId", "kind", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "confirmTransaction",
      description:
        "Konfirmasi pencatatan transaksi yang sebelumnya perlu verifikasi karena detailnya kurang jelas. Hanya panggil setelah createTransaction mengembalikan NEEDS_CONFIRMATION dan user sudah melihat preview serta memberikan konfirmasi eksplisit.",
      parameters: {
        type: "object",
        properties: {
          walletId: {
            type: "string",
            minLength: 1,
            description: "Wallet tujuan transaksi."
          },
          kind: {
            type: "string",
            enum: ["income", "expense"],
            description: "Jenis transaksi: income untuk pemasukan, expense untuk pengeluaran."
          },
          amount: {
            type: "number",
            minimum: 1,
            description: "Nominal transaksi dalam Rupiah."
          },
          categoryId: {
            type: "string",
            description: "Opsional. ID kategori."
          },
          categoryName: {
            type: "string",
            description: "Opsional. Nama kategori sebagai fallback."
          },
          note: {
            type: "string",
            description: "Opsional. Catatan transaksi singkat."
          },
          happenedAt: {
            type: "string",
            description: "Opsional. Tanggal transaksi dalam format YYYY-MM-DD."
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

function compressToolResult(rawJson: string, toolName: string): string {
  try {
    const parsed = JSON.parse(rawJson);
    // Don't compress error payloads
    if (parsed.error || parsed.ok === false) return rawJson;

    switch (toolName) {
      case "getFinancialRecap": {
        const recap = parsed as Record<string, unknown>;
        // Strip range fields
        delete recap.range;
        // Limit perWallet to busiest 3
        if (Array.isArray(recap.perWallet) && recap.perWallet.length > 3) {
          recap.perWallet = (recap.perWallet as Array<{ transactionCount: number }>)
            .sort((a, b) => b.transactionCount - a.transactionCount)
            .slice(0, 3);
        }
        // Limit topExpenseCategories to top 3
        if (Array.isArray(recap.topExpenseCategories) && recap.topExpenseCategories.length > 3) {
          recap.topExpenseCategories = (recap.topExpenseCategories as Array<{ total: number }>)
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
        }
        return JSON.stringify(recap);
      }
      case "getTransactions": {
        const arr = parsed as Array<Record<string, unknown>>;
        const trimmed = arr.slice(0, 5).map((item) => {
          const { id, walletId, ...rest } = item;
          return rest;
        });
        return JSON.stringify(trimmed);
      }
      default:
        return rawJson;
    }
  } catch {
    return rawJson;
  }
}

export async function executeAiToolCall(
  userId: string,
  toolCall: ChatCompletionMessageToolCall,
  context?: { userMessage?: string }
) {
  if (toolCall.type !== "function") {
    return JSON.stringify({ error: "UNSUPPORTED_TOOL_CALL" });
  }

  const args = parseArguments(toolCall.function.arguments);
  try {
    switch (toolCall.function.name) {
      case "getFinancialRecap":
        return compressToolResult(
          JSON.stringify(
            await getFinancialRecapForUser(
              userId,
              ((args.period as RekapPeriod | undefined) ?? "month"),
              (args.walletId as string | undefined) ?? null
            )
          ),
          "getFinancialRecap"
        );
      case "getTransactions":
        return compressToolResult(
          JSON.stringify(
            await getRecentTransactionsForUser(userId, (args.walletId as string | undefined) ?? null, Number(args.limit) || 8)
          ),
          "getTransactions"
        );
      case "getBudgetStatus":
        return JSON.stringify(await getBudgetStatusForUser(userId, String(args.walletId ?? "")));
      case "getCategories":
        return JSON.stringify(
          await getCategoriesForWallets(userId, typeof args.walletId === "string" && args.walletId ? [args.walletId] : undefined)
        );
      case "createTransaction": {
        const walletId = typeof args.walletId === "string" && args.walletId.trim() ? args.walletId.trim() : "";
        const kind = args.kind === "income" || args.kind === "expense" ? args.kind : null;
        const amount = Number(args.amount);

        // Pre-validation: return structured errors so the AI can correct itself
        const preValidationErrors: string[] = [];

        if (!walletId) {
          preValidationErrors.push("walletId wajib diisi (tidak boleh kosong).");
        }

        if (!kind) {
          preValidationErrors.push(`kind harus 'income' atau 'expense', bukan '${String(args.kind ?? "")}'.`);
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          preValidationErrors.push(`amount harus bilangan positif (> 0), bukan ${String(args.amount ?? "")}.`);
        }

        if (preValidationErrors.length > 0) {
          return JSON.stringify({
            error: "VALIDATION_FAILED",
            message: "Parameter transaksi tidak valid. Perbaiki input lalu panggil ulang createTransaction.",
            details: preValidationErrors
          });
        }

        const validKind = kind as "income" | "expense";
        const params: AiCreateTransactionParams = {
          walletId,
          kind: validKind,
          amount,
          categoryId: typeof args.categoryId === "string" && args.categoryId.trim() ? args.categoryId.trim() : null,
          categoryName: typeof args.categoryName === "string" && args.categoryName.trim() ? args.categoryName.trim() : null,
          note: typeof args.note === "string" && args.note.trim() ? args.note.trim() : null,
          happenedAt: typeof args.happenedAt === "string" && args.happenedAt.trim() ? args.happenedAt.trim() : null
        };

        // Confidence check phase — run in parallel
        const userMessage = context?.userMessage ?? "";
        const [walletName, duplicateCheck, dailyCapCheck] = await Promise.all([
          resolveWalletName(walletId),
          checkDuplicateTransaction(userId, walletId, validKind, amount),
          checkDailySpendingCap(userId, walletId, amount)
        ]);

        const confidence = computeTransactionConfidence(params, userMessage, walletName);

        // Check blocking conditions first
        if (duplicateCheck.isDuplicate) {
          return JSON.stringify({
            ok: false,
            code: "DUPLICATE_DETECTED",
            message: "Transaksi serupa sudah tercatat dalam 5 menit terakhir.",
            confidence: { score: confidence.score, tier: "low", reasons: confidence.reasons, flags: confidence.flags },
            preview: params,
            suggestion: "Silakan catat manual atau tunggu beberapa saat."
          });
        }

        if (dailyCapCheck.exceeded) {
          return JSON.stringify({
            ok: false,
            code: "DAILY_SPENDING_CAP_EXCEEDED",
            message: `Pengeluaran hari ini (${dailyCapCheck.todayTotal}) ditambah transaksi ini (${amount}) melebihi batas harian (${dailyCapCheck.threshold}).`,
            confidence: { score: confidence.score, tier: "low", reasons: confidence.reasons, flags: confidence.flags },
            preview: params,
            suggestion: "Silakan catat manual atau kurangi nominalnya."
          });
        }

        if (confidence.tier === "low") {
          return JSON.stringify({
            ok: false,
            code: "CONFIDENCE_TOO_LOW",
            message: "AI kurang yakin dengan detail transaksi.",
            confidence: { score: confidence.score, tier: "low", reasons: confidence.reasons, flags: confidence.flags },
            preview: params,
            suggestion: "Silakan catat manual."
          });
        }

        if (confidence.tier === "medium") {
          return JSON.stringify({
            ok: false,
            code: "NEEDS_CONFIRMATION",
            message: "AI perlu konfirmasi sebelum mencatat.",
            confidence: { score: confidence.score, tier: "medium", reasons: confidence.reasons, flags: confidence.flags },
            preview: params
          });
        }

        // Tier "high" — proceed with insertion
        return JSON.stringify(
          await createTransactionViaAi(userId, params)
        );
      }
      case "confirmTransaction": {
        const confWalletId = typeof args.walletId === "string" && args.walletId.trim() ? args.walletId.trim() : "";
        const confKind = args.kind === "income" || args.kind === "expense" ? args.kind : null;
        const confAmount = Number(args.amount);

        const confPreValidationErrors: string[] = [];

        if (!confWalletId) {
          confPreValidationErrors.push("walletId wajib diisi.");
        }

        if (!confKind) {
          confPreValidationErrors.push("kind harus 'income' atau 'expense'.");
        }

        if (!Number.isFinite(confAmount) || confAmount <= 0) {
          confPreValidationErrors.push("amount harus positif.");
        }

        if (confPreValidationErrors.length > 0) {
          return JSON.stringify({
            error: "VALIDATION_FAILED",
            message: "Parameter konfirmasi transaksi tidak valid.",
            details: confPreValidationErrors
          });
        }

        return JSON.stringify(
          await createTransactionViaAi(userId, {
            walletId: confWalletId,
            kind: confKind as "income" | "expense",
            amount: confAmount,
            categoryId: typeof args.categoryId === "string" && args.categoryId.trim() ? args.categoryId.trim() : null,
            categoryName: typeof args.categoryName === "string" && args.categoryName.trim() ? args.categoryName.trim() : null,
            note: typeof args.note === "string" && args.note.trim() ? args.note.trim() : null,
            happenedAt: typeof args.happenedAt === "string" && args.happenedAt.trim() ? args.happenedAt.trim() : null
          })
        );
      }
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
