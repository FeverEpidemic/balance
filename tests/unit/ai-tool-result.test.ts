import { describe, expect, it } from "vitest";
import { getTranslator } from "@/lib/i18n";
import {
  analyzeConversationToolResults,
  resolveBlockingToolErrorMessage
} from "@/lib/ai/tool-result";

describe("analyzeConversationToolResults", () => {
  it("returns confirmation_required for NEEDS_CONFIRMATION payloads", () => {
    const result = analyzeConversationToolResults([
      {
        role: "tool",
        content: JSON.stringify({
          code: "NEEDS_CONFIRMATION",
          confidence: { score: 0.72, tier: "medium", reasons: [], flags: [] },
          preview: {
            walletId: "wallet-1",
            kind: "expense",
            amount: 50000
          }
        })
      }
    ]);

    expect(result.status).toBe("confirmation_required");
    if (result.status === "confirmation_required") {
      expect(result.confirmation.preview.amount).toBe(50000);
      expect(result.confirmation.preview.kind).toBe("expense");
    }
  });

  it("returns blocking_error for ok:false payloads with a code", () => {
    const result = analyzeConversationToolResults([
      {
        role: "tool",
        content: JSON.stringify({
          ok: false,
          code: "CONFIDENCE_TOO_LOW",
          message: "AI kurang yakin dengan detail transaksi.",
          suggestion: "Silakan catat manual."
        })
      }
    ]);

    expect(result).toMatchObject({
      status: "blocking_error",
      blockingError: {
        code: "CONFIDENCE_TOO_LOW",
        message: "AI kurang yakin dengan detail transaksi.",
        suggestion: "Silakan catat manual."
      }
    });
  });

  it("returns blocking_error for payloads with error field", () => {
    const result = analyzeConversationToolResults([
      {
        role: "tool",
        content: JSON.stringify({
          error: "VALIDATION_FAILED",
          message: "Parameter transaksi tidak valid."
        })
      }
    ]);

    expect(result).toMatchObject({
      status: "blocking_error",
      blockingError: {
        error: "VALIDATION_FAILED",
        message: "Parameter transaksi tidak valid."
      }
    });
  });

  it("ignores invalid JSON tool content", () => {
    const result = analyzeConversationToolResults([
      {
        role: "tool",
        content: "{not-valid-json"
      }
    ]);

    expect(result).toEqual({
      status: "no_special_tool_result"
    });
  });

  it("does not trigger guard for fast path conversations without tool messages", () => {
    const result = analyzeConversationToolResults([
      {
        role: "system",
        content: "Prompt sistem"
      },
      {
        role: "user",
        content: "Pengeluaran minggu ini berapa?"
      },
      {
        role: "assistant",
        content: "Saya bantu ringkas ya."
      }
    ]);

    expect(result).toEqual({
      status: "no_special_tool_result"
    });
  });
});

describe("resolveBlockingToolErrorMessage", () => {
  it("uses localized copy for known blocking codes", () => {
    const t = getTranslator("en");
    const message = resolveBlockingToolErrorMessage(
      {
        code: "DUPLICATE_DETECTED",
        message: "Transaksi serupa sudah tercatat dalam 5 menit terakhir.",
        payload: {}
      },
      t
    );

    expect(message).toBe("A similar transaction was detected within the last 5 minutes. Please review it before recording again.");
  });

  it("falls back to raw message and suggestion for unknown errors", () => {
    const t = getTranslator("id");
    const message = resolveBlockingToolErrorMessage(
      {
        error: "SOMETHING_ELSE",
        message: "Tool gagal memproses permintaan.",
        suggestion: "Coba ulang lagi nanti.",
        payload: {}
      },
      t
    );

    expect(message).toBe("Tool gagal memproses permintaan. Coba ulang lagi nanti.");
  });

  it("falls back to generic localized copy when payload has no safe message", () => {
    const t = getTranslator("id");
    const message = resolveBlockingToolErrorMessage(
      {
        error: "WALLET_ACCESS_DENIED",
        payload: {}
      },
      t
    );

    expect(message).toBe("Ada kendala saat memproses hasil tool. Coba lagi beberapa saat lagi ya.");
  });
});
