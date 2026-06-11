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
  loading?: boolean;
  locale: AppLocale;
};

export function shouldSubmitChatFromKeydown(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey">) {
  return event.key === "Enter" && (event.ctrlKey || event.metaKey);
}

export function ChatInput({ value, onChange, onSubmit, disabled = false, loading = false, locale }: ChatInputProps) {
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
    <div className="min-w-0 rounded-[1.4rem] border border-[color:var(--soft-border)] bg-card p-3 shadow-serene sm:p-4">
      <textarea
        ref={ref}
        value={value}
        rows={1}
        disabled={disabled}
        maxLength={MAX_CHAT_MESSAGE_LENGTH}
        placeholder={t("chat.placeholder")}
        className="min-h-[3rem] resize-none overflow-y-auto break-words border-0 bg-transparent px-1 py-2 shadow-none focus:shadow-none"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (shouldSubmitChatFromKeydown(event.nativeEvent)) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-full text-xs leading-5 text-muted-foreground">{t("chat.shortcutHint")}</p>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="w-full rounded-full px-5 sm:w-auto"
        >
          {loading ? (
            <>
              <span className="chat-spin mr-2 inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
              {t("chat.send")}
            </>
          ) : (
            t("chat.send")
          )}
        </Button>
      </div>
    </div>
  );
}
