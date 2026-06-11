export function shouldSubmitChatFromKeydown(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey">
) {
  return event.key === "Enter" && (event.ctrlKey || event.metaKey);
}
