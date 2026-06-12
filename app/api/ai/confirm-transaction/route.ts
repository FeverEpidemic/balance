import { requireUser } from "@/lib/auth";
import { createTransactionViaAi } from "@/lib/ai/data";
import type { AiCreateTransactionParams } from "@/lib/ai/data";

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();

    const body = (await request.json()) as {
      walletId: string;
      kind: "income" | "expense";
      amount: number;
      categoryId?: string | null;
      categoryName?: string | null;
      note?: string | null;
      happenedAt?: string | null;
    };

    const { walletId, kind, amount, categoryId, categoryName, note, happenedAt } = body;

    if (!walletId || !kind || !Number.isFinite(amount) || amount <= 0) {
      return Response.json(
        { ok: false, message: "Parameter transaksi tidak valid." },
        { status: 400 }
      );
    }

    const params: AiCreateTransactionParams = {
      walletId,
      kind,
      amount,
      categoryId: categoryId ?? null,
      categoryName: categoryName ?? null,
      note: note ?? null,
      happenedAt: happenedAt ?? null
    };

    const result = await createTransactionViaAi(user.id, params);

    const status = result.ok ? 200 : 400;

    return Response.json(result, { status });
  } catch (error: unknown) {
    console.warn("[confirm-transaction] Error:", (error as Error)?.message ?? error);
    return Response.json(
      { ok: false, message: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
