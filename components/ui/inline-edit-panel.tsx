"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InlineEditPanelProps = {
  buttonLabel?: string;
  children: ReactNode;
  className?: string;
  closeSignal?: unknown;
  description?: string;
  title?: string;
};

export function InlineEditPanel({
  buttonLabel = "Ubah data",
  children,
  className,
  closeSignal,
  description = "Panel ini bisa dibuka untuk memperbarui data tanpa pindah halaman.",
  title = "Bisa diedit"
}: InlineEditPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastCloseSignalRef = useRef(closeSignal);

  useEffect(() => {
    if (lastCloseSignalRef.current !== closeSignal) {
      setOpen(false);
      lastCloseSignalRef.current = closeSignal;
    }
  }, [closeSignal]);

  useEffect(() => {
    if (!open || !panelRef.current) {
      return;
    }

    const firstField = panelRef.current.querySelector<HTMLElement>("input, select, textarea, button");

    if (!firstField) {
      return;
    }

    window.requestAnimationFrame(() => {
      firstField.focus();
    });
  }, [open]);

  return (
    <div className={cn("glass-panel mt-4 rounded-xl", open ? "shadow-serene" : "", className)}>
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary/65" aria-hidden="true" />
            <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">{title}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl border px-4 py-2 text-center font-label text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]",
            open
              ? "border-primary/20 bg-primary text-white shadow-serene"
              : "border-border bg-overlay text-primary-strong hover:border-primary/20 hover:bg-primary-soft"
          )}
        >
          {open ? "Tutup editor" : buttonLabel}
        </button>
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity,transform,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div ref={panelRef} className={cn("border-t border-border p-3 pt-4", open ? "translate-y-0" : "-translate-y-2")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
