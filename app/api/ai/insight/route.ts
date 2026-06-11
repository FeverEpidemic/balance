import { after, NextResponse } from "next/server";
import { getFinancialRecapForUser } from "@/lib/ai/data";
import { buildDeterministicInsight, generateRecapNarrative } from "@/lib/ai/recap";
import { requireUser } from "@/lib/auth";
import { redisCache } from "@/lib/redis";

const INSIGHT_FRESH_TTL_SECONDS = 60 * 45;
const INSIGHT_STALE_TTL_SECONDS = 60 * 60 * 4;

function runAfterResponse(task: () => Promise<void>) {
  after(async () => {
    try {
      await task();
    } catch {
      // Insight generation is best-effort and should never break the dashboard.
    }
  });
}

export async function GET(request: Request) {
  const { user } = await requireUser();
  const { searchParams } = new URL(request.url);
  const walletId = searchParams.get("walletId");
  const cacheKey = `ai:insight:${user.id}:${walletId ?? "all"}`;

  try {
    const recap = await getFinancialRecapForUser(user.id, "month", walletId);
    const insight = await redisCache.getOrSetSwr(cacheKey, INSIGHT_FRESH_TTL_SECONDS, INSIGHT_STALE_TTL_SECONDS, async ({ reason }) => {
      if (reason === "refresh") {
        return {
          insight: await generateRecapNarrative(recap)
        };
      }

      const deterministicInsight = {
        insight: buildDeterministicInsight(recap)
      };

      runAfterResponse(async () => {
        const refreshedInsight = {
          insight: await generateRecapNarrative(recap)
        };

        await redisCache.setSwr(cacheKey, INSIGHT_FRESH_TTL_SECONDS, INSIGHT_STALE_TTL_SECONDS, refreshedInsight);
      });

      return deterministicInsight;
    });

    return NextResponse.json(insight);
  } catch {
    return NextResponse.json({ insight: "" });
  }
}
