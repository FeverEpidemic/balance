"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/ai/guard-shared";
import type { AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  locale: AppLocale;
};

export function ChatInput({ value, onChange, onSubmit, disabled = false, locale }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const t = getTranslator(locale);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.style.height = "0px";
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, 180)}px`;
  }, [value]);

  return (
    <div className="rounded-[1.4rem] border border-[color:var(--soft-border)] bg-card p-3 shadow-serene">
      <textarea
        ref={ref}
        value={value}
        rows={1}
        disabled={disabled}
        maxLength={MAX_CHAT_MESSAGE_LENGTH}
        placeholder={t("chat.placeholder")}
        className="min-h-[3rem] resize-none border-0 bg-transparent px-1 py-2 shadow-none focus:shadow-none"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("chat.shortcutHint")}</p>
        <Button type="button" onClick={onSubmit} disabled={disabled || !value.trim()} className="rounded-full px-5">
          {t("chat.send")}
        </Button>
      </div>
    </div>
  );
}
