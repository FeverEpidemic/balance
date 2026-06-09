"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { changelogs, getLatestVersion, getUnreadEntries, type ChangelogEntry } from "@/lib/changelogs";
import { getTranslator, localizePath } from "@/lib/i18n";
import { formatShortDate } from "@/lib/utils";

const STORAGE_KEY = "balance-changelog-seen";

let hasCheckedThisSession = false;

export function ChangelogPopup() {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [open, setOpen] = useState(false);
  const [unreadEntries, setUnreadEntries] = useState<ChangelogEntry[]>([]);
  const latestVersion = useMemo(() => getLatestVersion(), []);

  useEffect(() => {
    if (hasCheckedThisSession || changelogs.length === 0) {
      return;
    }

    hasCheckedThisSession = true;
    const seenVersion = window.localStorage.getItem(STORAGE_KEY);
    const entries = getUnreadEntries(seenVersion);

    if (entries.length > 0) {
      setUnreadEntries(entries);
      setOpen(true);
    }
  }, []);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, latestVersion);
    setOpen(false);
  }

  if (unreadEntries.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : dismiss())}>
      <DialogContent className="max-h-[88vh] overflow-hidden p-0">
        <div className="p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t("changelogs.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("changelogs.dialogDescription")}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[52vh] space-y-3 overflow-y-auto px-5 pb-1 sm:px-6">
          {unreadEntries.map((entry) => (
            <article key={entry.version} className="rounded-[1.25rem] border border-border bg-muted p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-3 py-1 font-label text-xs text-[var(--button-primary-text)]">
                  {t("changelogs.versionLabel")} {entry.version}
                </span>
                <span className="text-xs text-muted-foreground">{formatShortDate(entry.date, locale)}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-medium text-foreground">{entry.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
              <ul className="mt-4 space-y-2">
                {entry.features.map((feature) => (
                  <li key={`${entry.version}-${feature.text}`} className="flex gap-3 text-sm text-foreground">
                    <span aria-hidden="true" className="mt-0.5 shrink-0">
                      {feature.icon}
                    </span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <DialogFooter className="border-t border-border bg-card px-5 py-4 sm:px-6">
          <Link
            href={localizePath(locale, "/changelogs")}
            onClick={dismiss}
            className="inline-flex min-h-[3.25rem] items-center justify-center rounded-xl border border-border px-4 py-3 font-label text-sm font-medium text-foreground transition hover:bg-muted"
          >
            {t("changelogs.dialogViewAll")}
          </Link>
          <Button type="button" onClick={dismiss}>
            {t("changelogs.dialogDismiss")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
