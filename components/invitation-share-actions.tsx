"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type InvitationShareActionsProps = {
  inviteUrl: string;
  role: "owner" | "editor" | "viewer";
  walletName: string;
};

export function InvitationShareActions({ inviteUrl, role, walletName }: InvitationShareActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setFeedback("Tautan undangan disalin.");
    } catch (error) {
      console.error("copyInviteLink:failed", { inviteUrl, error });
      setFeedback("Gagal menyalin tautan. Silakan buka tautan lalu salin manual.");
    }
  }

  async function handleShare() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      setFeedback("Fitur bagikan belum tersedia di perangkat ini. Gunakan tombol salin tautan.");
      return;
    }

    try {
      await navigator.share({
        title: `Undangan wallet ${walletName}`,
        text: `Bergabung ke wallet ${walletName} di Balance.`,
        url: inviteUrl
      });
      setFeedback("Tautan undangan siap dibagikan.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("shareInviteLink:failed", { inviteUrl, error });
      setFeedback("Gagal membuka menu bagikan. Gunakan tombol salin tautan.");
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      <p className="text-xs font-medium text-foreground">Tautan undangan untuk role {role}</p>
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
          Salin tautan
        </button>
        <button
          type="button"
          onClick={handleShare}
          className={cn(
            "inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-3 py-2 font-label text-sm font-medium text-foreground transition hover:bg-muted"
          )}
        >
          Bagikan
        </button>
      </div>
      {feedback && <p className="mt-2 text-xs text-muted-foreground">{feedback}</p>}
    </div>
  );
}
