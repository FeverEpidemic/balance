"use client";

import { useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type InvitationShareActionsProps = {
  inviteUrl: string;
  role: "owner" | "editor" | "viewer";
  walletName: string;
};

export function InvitationShareActions({ inviteUrl, role, walletName }: InvitationShareActionsProps) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setFeedback(t("inviteShare.copied"));
    } catch (error) {
      console.error("copyInviteLink:failed", { inviteUrl, error });
      setFeedback(t("inviteShare.copyFailed"));
    }
  }

  async function handleShare() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      setFeedback(t("inviteShare.shareUnavailable"));
      return;
    }

    try {
      await navigator.share({
        title: t("inviteShare.shareTitle", { walletName }),
        text: t("inviteShare.shareText", { walletName }),
        url: inviteUrl
      });
      setFeedback(t("inviteShare.shareReady"));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("shareInviteLink:failed", { inviteUrl, error });
      setFeedback(t("inviteShare.shareFailed"));
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      <p className="text-xs font-medium text-foreground">{t("inviteShare.roleLink", { role })}</p>
      <a
        href={inviteUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block break-all text-xs text-primary underline-offset-2 hover:underline"
      >
        {inviteUrl}
      </a>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-3 py-2 font-label text-sm font-medium text-foreground transition hover:bg-muted"
          )}
        >
          {t("inviteShare.copyButton")}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className={cn(
            "inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-3 py-2 font-label text-sm font-medium text-foreground transition hover:bg-muted"
          )}
        >
          {t("inviteShare.shareButton")}
        </button>
      </div>
      {feedback && <p className="mt-2 text-xs text-muted-foreground">{feedback}</p>}
    </div>
  );
}
