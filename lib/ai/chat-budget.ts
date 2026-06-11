import "server-only";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  budgetConversationMessages,
  COMPACT_SYSTEM_PROMPT_FLOOR_TOKENS,
  estimateConversationTokens,
  type ConversationMessage
} from "@/lib/ai/token-budget";

export const TOOL_RESULT_TOKEN_SHARE_LIMIT = 0.4;

export type ScoredRequestMessage = {
  role: "user" | "assistant";
  content: string;
  score?: number;
};

export function buildBudgetedConversation(input: {
  systemPrompt: string;
  compactSystemPrompt: string;
  messages: ScoredRequestMessage[];
  tokenBudget: number;
}) {
  let usedCompactPrompt = false;
  let wasTrimmed = false;

  let conversationMessages: ConversationMessage[] = [
    { role: "system", content: input.systemPrompt, relevanceScore: Number.POSITIVE_INFINITY },
    ...input.messages.map((message) => ({
      role: message.role,
      content: message.content,
      relevanceScore: message.score
    }))
  ];

  let estimatedTokens = estimateConversationTokens(conversationMessages, {
    includeToolDefinitions: true
  });

  if (estimatedTokens > input.tokenBudget) {
    usedCompactPrompt = true;
    conversationMessages = [
      { role: "system", content: input.compactSystemPrompt, relevanceScore: Number.POSITIVE_INFINITY },
      ...input.messages.map((message) => ({
        role: message.role,
        content: message.content,
        relevanceScore: message.score
      }))
    ];

    estimatedTokens = estimateConversationTokens(conversationMessages, {
      includeToolDefinitions: true
    });
  }

  if (estimatedTokens > input.tokenBudget) {
    wasTrimmed = true;
    conversationMessages = budgetConversationMessages(conversationMessages, input.tokenBudget, {
      includeToolDefinitions: true
    });
    estimatedTokens = estimateConversationTokens(conversationMessages, {
      includeToolDefinitions: true
    });
  }

  return {
    conversationMessages,
    estimatedTokens,
    usedCompactPrompt,
    wasTrimmed
  };
}

export function exceedsPreflightCompactBudget(input: {
  messages: ScoredRequestMessage[];
  tokenBudget: number;
}) {
  const estimatedTokens = estimateConversationTokens(
    [
      { role: "system", content: "" },
      ...input.messages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ],
    {
      includeToolDefinitions: true,
      extraTokens: COMPACT_SYSTEM_PROMPT_FLOOR_TOKENS
    }
  );

  return estimatedTokens > input.tokenBudget;
}

export function getToolResultTokens(messages: ConversationMessage[]) {
  return estimateConversationTokens(
    messages.filter((message) => message.role === "tool"),
    { includeMessageFraming: true }
  );
}

export function shouldStopToolCallsForBudget(input: {
  messages: ConversationMessage[];
  tokenBudget: number;
  toolResultShareLimit?: number;
}) {
  const toolResultTokens = getToolResultTokens(input.messages);
  return toolResultTokens > input.tokenBudget * (input.toolResultShareLimit ?? TOOL_RESULT_TOKEN_SHARE_LIMIT);
}

export function toOpenAiMessages(messages: ConversationMessage[]): ChatCompletionMessageParam[] {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "tool",
        content: message.content,
        tool_call_id: message.tool_call_id ?? ""
      };
    }

    if (message.role === "assistant" && message.tool_calls) {
      return {
        role: "assistant",
        content: message.content,
        tool_calls: message.tool_calls as NonNullable<Extract<ChatCompletionMessageParam, { role: "assistant" }>["tool_calls"]>
      };
    }

    return {
      role: message.role,
      content: message.content
    } as ChatCompletionMessageParam;
  });
}
