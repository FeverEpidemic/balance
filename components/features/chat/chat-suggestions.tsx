"use client";

import { cn } from "@/lib/utils";

type ChatSuggestionsProps = {
  items: Array<{ key: string; label: string; prompt: string }>;
  onSelect: (prompt: string) => void;
  activeKey?: string;
};

export function ChatSuggestions({ items, onSelect, activeKey }: ChatSuggestionsProps) {
  return (
    <div className="touch-scroll-x flex gap-2 pb-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.prompt)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-2 text-[11px] font-semibold tracking-[0.04em] transition sm:text-xs sm:uppercase sm:tracking-[0.12em]",
            activeKey === item.key
              ? "border-primary bg-primary-soft text-primary-strong"
              : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
