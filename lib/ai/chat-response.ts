export function shouldReturnDirectAiReply(input: {
  assistantContent: string | null | undefined;
  hasToolCalls: boolean;
}) {
  const content = input.assistantContent?.trim() ?? "";

  return Boolean(content) && !input.hasToolCalls;
}
