import { NextResponse } from "next/server";
import { getFinancialRecapForUser } from "@/lib/ai/data";
import { generateRecapNarrative } from "@/lib/ai/recap";
import { requireUser } from "@/lib/auth";
import { redisCache } from "@/lib/redis";

const INSIGHT_TTL_SECONDS = 60 * 15;

export async function GET(request: Request) {
  const { user } = await requireUser();
  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get("walletId");
  const cacheKey = `ai:insight:${user.id}:${walletId ?? "all"}`;

  try {
    const insight = await redisCache.getOrSet(cacheKey, INSIGHT_TTL_SECONDS, async () => {
      const recap = await getFinancialRecapForUser(user.id, "month", walletId);
      return {
        insight: await generateRecapNarrative(recap)
      };
    });

    return NextResponse.json(insight);
  } catch {
    return NextResponse.json({ insight: "" });
  }
}
