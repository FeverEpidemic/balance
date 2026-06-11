"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

function renderInlineMarkdown(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderMarkdown(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");

      if (lines.every((line) => line.trim().startsWith("- "))) {
        return `<ul>${lines
          .map((line) => `<li>${renderInlineMarkdown(line.trim().slice(2))}</li>`)
          .join("")}</ul>`;
      }

      return `<p>${lines.map((line) => renderInlineMarkdown(line)).join("<br />")}</p>`;
    })
    .join("");
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isUser = role === "user";
  const [justCompleted, setJustCompleted] = useState(false);
  const [dotsVisible, setDotsVisible] = useState(isStreaming);
  const prevStreaming = useRef(isStreaming);

  useEffect(() => {
    const wasStreaming = prevStreaming.current;
    prevStreaming.current = isStreaming;

    if (wasStreaming && !isStreaming) {
      // Streaming just finished — trigger completion flash
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);

      // Keep dots rendered for a smooth fade-out
      setTimeout(() => setDotsVisible(false), 300);
    } else if (isStreaming) {
      setDotsVisible(true);
    }
  }, [isStreaming]);

  return (
    <div className={cn("flex min-w-0", isUser ? "justify-end" : "justify-start")} style={{ animation: "page-enter 220ms ease-out" }}>
      <div
        className={cn(
          "min-w-0 max-w-[92%] overflow-hidden rounded-[1.35rem] px-4 py-3 text-sm leading-7 shadow-serene sm:max-w-[88%] lg:max-w-[85%]",
          isUser
            ? "bg-primary-soft text-primary-strong"
            : "border border-[color:var(--soft-border)] bg-card text-foreground",
          justCompleted && !isUser && "chat-message-complete"
        )}
      >
        <div className="prose prose-sm max-w-none break-words prose-p:my-0 prose-ul:my-0 prose-ul:pl-5 prose-li:my-0 dark:prose-invert [&_*]:break-words">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </div>
        {dotsVisible ? (
          <div
            className="mt-3 flex items-center gap-1.5 transition-opacity duration-300"
            style={{ opacity: isStreaming ? 1 : 0 }}
          >
            <span className="chat-dot-bounce h-2 w-2 rounded-full bg-primary/70" style={{ animationDelay: "0ms" }} />
            <span className="chat-dot-bounce h-2 w-2 rounded-full bg-primary/50" style={{ animationDelay: "160ms" }} />
            <span className="chat-dot-bounce h-2 w-2 rounded-full bg-primary/30" style={{ animationDelay: "320ms" }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
