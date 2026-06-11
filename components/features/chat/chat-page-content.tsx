"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChatInput } from "@/components/features/chat/chat-input";
import { ChatMessage } from "@/components/features/chat/chat-message";
import { ChatSuggestions } from "@/components/features/chat/chat-suggestions";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { CHAT_STORAGE_KEY, buildChatRequestMessages, clearChatHistory, sanitizeStoredChatSession, type ChatIntent, type UiChatMessage } from "@/lib/chat-session";
import type { AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n";

type WalletOption = {
  id: string;
  name: string;
  kind: "personal" | "shared";
};

type ChatPageContentProps = {
  locale: AppLocale;
  shell: {
    userName: string;
    walletCount: number;
    budgetCount: number;
    memberCount: number;
    primaryWalletId: string | null;
  };
  wallets: WalletOption[];
};

const periods = ["day", "week", "month"] as const;

export function ChatPageContent({ locale, shell, wallets }: ChatPageContentProps) {
  const t = getTranslator(locale);
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasHydratedSession, setHasHydratedSession] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<(typeof periods)[number]>("month");
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [activeSuggestion, setActiveSuggestion] = useState<string | undefined>(undefined);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);

    if (!raw) {
      setHasHydratedSession(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const stored = sanitizeStoredChatSession(parsed);

      if (!stored) {
        setHasHydratedSession(true);
        return;
      }

      setMessages(stored.messages);
      setSelectedPeriod(stored.selectedPeriod);
      setSelectedWalletId(stored.selectedWalletId);
      setActiveSuggestion(stored.activeSuggestion);
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    } finally {
      setHasHydratedSession(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedSession) {
      return;
    }

    window.localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({
        messages,
        selectedPeriod,
        selectedWalletId,
        activeSuggestion
      })
    );
  }, [activeSuggestion, hasHydratedSession, messages, selectedPeriod, selectedWalletId]);

  const suggestions = useMemo(
    () => [
      { key: "day", label: t("chat.suggestions.day"), prompt: t("chat.prompts.day") },
      { key: "week", label: t("chat.suggestions.week"), prompt: t("chat.prompts.week") },
      { key: "month", label: t("chat.suggestions.month"), prompt: t("chat.prompts.month") },
      { key: "record", label: t("chat.suggestions.record"), prompt: t("chat.prompts.record") },
      { key: "save", label: t("chat.suggestions.save"), prompt: t("chat.prompts.save") },
      { key: "analysis", label: t("chat.suggestions.analysis"), prompt: t("chat.prompts.analysis") }
    ],
    [t]
  );

  async function handleSubmit(overridePrompt?: string, options?: { period?: (typeof periods)[number]; intent?: ChatIntent }) {
    const prompt = (overridePrompt ?? input).trim();

    if (!prompt || isLoading) {
      return;
    }

    const effectivePeriod = options?.period ?? selectedPeriod;
    const intent = options?.intent ?? "chat";
    const userMessage: UiChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: prompt
    };
    const assistantId = `${Date.now()}-assistant`;
    const nextMessages = intent === "recap" ? [userMessage] : [...messages, userMessage];

    setMessages([
      ...nextMessages,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true
      }
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const fetchTimeoutId = setTimeout(() => controller.abort(), 90_000);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          intent,
          messages: buildChatRequestMessages({
            history: messages,
            userMessage,
            intent
          }),
          locale,
          walletId: selectedWalletId || undefined,
          period: effectivePeriod
        }),
        signal: controller.signal
      });

      clearTimeout(fetchTimeoutId);

      if (!response.body) {
        throw new Error("EMPTY_STREAM");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();

          if (!line.startsWith("data: ")) {
            continue;
          }

          const payload = JSON.parse(line.slice(6)) as { type: "token" | "done" | "streamTimeout"; content?: string };

          if (payload.type === "token") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: `${message.content}${payload.content ?? ""}`
                    }
                  : message
              )
            );
          }

          if (payload.type === "streamTimeout") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: `${message.content}\n\n⚠️ ${t("chat.streamTimeout")}`,
                      isStreaming: false
                    }
                  : message
              )
            );
          }

          if (payload.type === "done") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      isStreaming: false
                    }
                  : message
              )
            );
          }
        }
      }
    } catch (error: unknown) {
      const isAbortError = error instanceof DOMException && error.name === "AbortError";

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: message.content
                  ? `${message.content}\n\n⚠️ ${t(isAbortError ? "chat.streamTimeout" : "chat.errorState")}`
                  : t(isAbortError ? "chat.streamTimeout" : "chat.errorState"),
                isStreaming: false
              }
            : message
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }
    clearChatHistory();
    setMessages([]);
    setSelectedPeriod("month");
    setSelectedWalletId("");
    setActiveSuggestion(undefined);
    setInput("");
    setShowResetConfirm(false);
  }

  function handleRecapSuggestion(period: (typeof periods)[number]) {
    const prompt = t(`chat.prompts.${period}`);
    const suggestion = suggestions.find((item) => item.key === period);

    setSelectedPeriod(period);
    setActiveSuggestion(suggestion?.key);
    void handleSubmit(prompt, { period, intent: "recap" });
  }

  return (
    <AppShell
      currentPath="/chat"
      title={t("chat.pageTitle")}
      subtitle={t("chat.pageSubtitle")}
      userName={shell.userName}
      walletCount={shell.walletCount}
      budgetCount={shell.budgetCount}
      memberCount={shell.memberCount}
      primaryWalletId={shell.primaryWalletId}
      headerAction={
        <Button type="button" variant="soft" className="rounded-full" onClick={() => handleRecapSuggestion("month")}>
          {t("chat.quickStart")}
        </Button>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div className="card space-y-4">
            <ChatSuggestions
              items={suggestions}
              activeKey={activeSuggestion}
              onSelect={(prompt) => {
                const selected = suggestions.find((item) => item.prompt === prompt);

                if (!selected) {
                  return;
                }

                if (selected.key === "day" || selected.key === "week" || selected.key === "month") {
                  handleRecapSuggestion(selected.key);
                  return;
                }

                setActiveSuggestion(selected.key);
                void handleSubmit(prompt, { intent: "chat" });
              }}
            />

            <div className="touch-scroll-x flex gap-2 pb-1">
              {periods.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    selectedPeriod === period ? "bg-primary text-[var(--button-primary-text)]" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t(`chat.period.${period}`)}
                </button>
              ))}
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <div className="min-w-0">
                <label className="mb-2 block font-label text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("common.wallet")}</label>
                <select value={selectedWalletId} onChange={(event) => setSelectedWalletId(event.target.value)}>
                  <option value="">{t("chat.allWallets")}</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 rounded-[1rem] border border-[color:var(--soft-border)] bg-muted px-4 py-3">
                <p className="font-label text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("chat.infoTitle")}</p>
                <p className="mt-2 text-sm text-foreground/80">{t("chat.infoDescription")}</p>
              </div>
            </div>
          </div>

          <div className="card min-h-[24rem] min-w-0 overflow-hidden">
            {messages.length > 0 && (
              <div className="flex items-center justify-end mb-3">
                {showResetConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t("chat.resetConfirm")}</span>
                    <Button type="button" variant="primary" size="sm" onClick={handleReset}>
                      Ya, Hapus
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                         className="stroke-current" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 7h15" />
                      <path d="M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
                      <path d="M5.5 7l1 13h11l1-13" />
                      <path d="M10 10.5v6" />
                      <path d="M14 10.5v6" />
                    </svg>
                    {t("chat.resetHistory")}
                  </Button>
                )}
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-[1.2rem] border border-dashed border-[color:var(--soft-border)] bg-muted/50 px-6 text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-serene">
                  <AppIcon name="chat" className="h-6 w-6" tone="primary" />
                </span>
                <h3 className="headline-md mt-4">{t("chat.emptyState")}</h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("chat.emptyDescription")}</p>
              </div>
            ) : (
              <div className="min-w-0 space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} role={message.role} content={message.content} isStreaming={message.isStreaming} />
                ))}
              </div>
            )}
          </div>

          <ChatInput value={input} onChange={setInput} onSubmit={() => void handleSubmit()} disabled={isLoading} locale={locale} />
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="card">
            <p className="eyebrow">{t("chat.sidebarTitle")}</p>
            <h3 className="headline-md mt-2">{t("chat.sidebarHeading")}</h3>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              <p>{t("chat.sidebarPoint1")}</p>
              <p>{t("chat.sidebarPoint2")}</p>
              <p>{t("chat.sidebarPoint3")}</p>
              <p>{t("chat.sidebarPoint4")}</p>
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
