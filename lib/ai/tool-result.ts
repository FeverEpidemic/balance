type ToolConversationMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

type ToolPayload = Record<string, unknown>;

type ToolTranslator = (key: string) => string;

type TransactionPreview = {
  walletId: string;
  kind: string;
  amount: number;
  categoryId?: string | null;
  categoryName?: string | null;
  note?: string | null;
  happenedAt?: string | null;
};

export type NeedsConfirmationToolResult = {
  code: "NEEDS_CONFIRMATION";
  confidence: { score: number; tier: string; reasons: string[]; flags: string[] };
  preview: TransactionPreview;
};

export type BlockingToolResult = {
  code?: string;
  error?: string;
  message?: string;
  suggestion?: string;
  payload: ToolPayload;
};

export type ToolResultAnalysis =
  | {
      status: "confirmation_required";
      confirmation: NeedsConfirmationToolResult;
    }
  | {
      status: "blocking_error";
      blockingError: BlockingToolResult;
    }
  | {
      status: "no_special_tool_result";
    };

const BLOCKING_TOOL_CODES = new Set([
  "CONFIDENCE_TOO_LOW",
  "DUPLICATE_DETECTED",
  "DAILY_SPENDING_CAP_EXCEEDED"
]);

const BLOCKING_TOOL_COPY_KEYS: Record<string, string> = {
  CONFIDENCE_TOO_LOW: "chat.toolErrorConfidenceTooLow",
  DUPLICATE_DETECTED: "chat.toolErrorDuplicateDetected",
  DAILY_SPENDING_CAP_EXCEEDED: "chat.toolErrorDailyCapExceeded",
  VALIDATION_FAILED: "chat.toolErrorValidationFailed"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseToolPayload(content: string): ToolPayload | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getStringValue(payload: ToolPayload, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isNeedsConfirmationPayload(payload: ToolPayload): payload is NeedsConfirmationToolResult {
  return payload.code === "NEEDS_CONFIRMATION" && isRecord(payload.preview) && isRecord(payload.confidence);
}

function isBlockingToolPayload(payload: ToolPayload) {
  if (payload.ok === false) {
    return true;
  }

  const error = getStringValue(payload, "error");
  if (error) {
    return true;
  }

  const code = getStringValue(payload, "code");
  return code ? BLOCKING_TOOL_CODES.has(code) : false;
}

export function analyzeConversationToolResults(messages: ToolConversationMessage[]): ToolResultAnalysis {
  let firstBlockingError: BlockingToolResult | null = null;

  for (const message of messages) {
    if (message.role !== "tool") {
      continue;
    }

    const payload = parseToolPayload(message.content);
    if (!payload) {
      continue;
    }

    if (isNeedsConfirmationPayload(payload)) {
      return {
        status: "confirmation_required",
        confirmation: payload
      };
    }

    if (!firstBlockingError && isBlockingToolPayload(payload)) {
      firstBlockingError = {
        code: getStringValue(payload, "code"),
        error: getStringValue(payload, "error"),
        message: getStringValue(payload, "message"),
        suggestion: getStringValue(payload, "suggestion"),
        payload
      };
    }
  }

  if (firstBlockingError) {
    return {
      status: "blocking_error",
      blockingError: firstBlockingError
    };
  }

  return {
    status: "no_special_tool_result"
  };
}

export function resolveBlockingToolErrorMessage(
  blockingError: BlockingToolResult,
  t: ToolTranslator
) {
  const localizedKey = blockingError.code ? BLOCKING_TOOL_COPY_KEYS[blockingError.code] : undefined;
  const localizedMessage = localizedKey ? t(localizedKey) : "";
  const rawMessage = blockingError.message ?? "";
  const suggestion = blockingError.suggestion ?? "";

  if (localizedMessage) {
    if (suggestion && suggestion !== localizedMessage) {
      return `${localizedMessage} ${suggestion}`;
    }

    return localizedMessage;
  }

  if (rawMessage) {
    if (suggestion && suggestion !== rawMessage) {
      return `${rawMessage} ${suggestion}`;
    }

    return rawMessage;
  }

  if (suggestion) {
    return suggestion;
  }

  return t("chat.toolErrorGeneric");
}
