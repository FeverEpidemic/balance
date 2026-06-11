"use client";

import { useEffect, useState } from "react";
import type { AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n";

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
};

type ChatRateLimitIndicatorProps = {
  rateLimitInfo: RateLimitInfo | null;
  dailyLimitInfo: RateLimitInfo | null;
  locale: AppLocale;
};

function RateLimitBar({
  label,
  limit,
  remaining,
  resetAt
}: {
  label: string;
  limit: number;
  remaining: number;
  resetAt: number;
}) {
  const isExhausted = remaining === 0;
  const percentage = limit > 0 ? Math.round((remaining / limit) * 100) : 0;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </span>
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {isExhausted
              ? "Habis / Exhausted"
              : `${remaining}/${limit}`}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isExhausted ? "bg-red-400" : "bg-primary/50"
            }`}
            style={{ width: `${isExhausted ? 100 : percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ChatRateLimitIndicator({ rateLimitInfo, dailyLimitInfo, locale }: ChatRateLimitIndicatorProps) {
  const t = getTranslator(locale);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!rateLimitInfo || rateLimitInfo.remaining > 0) {
      setCountdown(0);
      return;
    }

    const resetAt = rateLimitInfo.resetAt;

    function tick() {
      const seconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
      setCountdown(seconds);
    }

    tick();
    const interval = setInterval(tick, 1_000);
    return () => clearInterval(interval);
  }, [rateLimitInfo]);

  // Don't render if neither limit has data
  if (
    (!rateLimitInfo || rateLimitInfo.limit === 0) &&
    (!dailyLimitInfo || dailyLimitInfo.limit === 0)
  ) {
    return null;
  }

  return (
    <div className="border-t border-[color:var(--soft-border)] pt-3 mt-3 space-y-2">
      {/* Per-minute rate limit bar */}
      {rateLimitInfo && rateLimitInfo.limit > 0 && (
        <div>
          <RateLimitBar
            label={t("chat.rateLimitLabel")}
            limit={rateLimitInfo.limit}
            remaining={rateLimitInfo.remaining}
            resetAt={rateLimitInfo.resetAt}
          />
          {rateLimitInfo.remaining === 0 && countdown > 0 && (
            <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
              {t("chat.rateLimitResetIn", { seconds: countdown })}
            </p>
          )}
        </div>
      )}

      {/* Daily limit bar */}
      {dailyLimitInfo && dailyLimitInfo.limit > 0 && (
        <div>
          <RateLimitBar
            label={t("chat.dailyRateLimitLabel")}
            limit={dailyLimitInfo.limit}
            remaining={dailyLimitInfo.remaining}
            resetAt={dailyLimitInfo.resetAt}
          />
          {dailyLimitInfo.remaining === 0 && (
            <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
              {t("chat.dailyRateLimitResetTomorrow")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
