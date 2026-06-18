"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createWalletInvitation } from "@/app/actions/wallets";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { getTranslator } from "@/lib/i18n";

function CreateInvitationDialogButtonInner({ walletId }: { walletId: string }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const error = searchParams.get("error");

  // The server action redirects back to this page with ?message=... (success)
  // or ?error=... (failure). When that URL update reaches the client, close
  // the dialog so the user lands on the refreshed list of active invitations
  // (or sees the toast for the error case).
  useEffect(() => {
    if (open && (message || error)) {
      setOpen(false);
    }
  }, [open, message, error]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="mt-6 w-full">
        {t("members.createButton")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("members.createDialogTitle")}</DialogTitle>
            <DialogDescription>{t("members.createDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form action={createWalletInvitation} className="mt-5 grid gap-4">
            <input type="hidden" name="wallet_id" value={walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">
                {t("members.accessLabel")}
              </span>
              <select name="role" defaultValue="viewer" className="w-full">
                <option value="viewer">{t("members.roleViewer")}</option>
                <option value="editor">{t("members.roleEditor")}</option>
              </select>
            </label>
            <SubmitButton pendingText={t("members.createPending")} className="w-full">
              {t("members.createButton")}
            </SubmitButton>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CreateInvitationDialogButton({ walletId }: { walletId: string }) {
  // useSearchParams() requires a Suspense boundary so the page can statically
  // prerender the surrounding shell without waiting on the search params.
  return (
    <Suspense fallback={null}>
      <CreateInvitationDialogButtonInner walletId={walletId} />
    </Suspense>
  );
}
