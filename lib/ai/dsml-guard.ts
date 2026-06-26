/**
 * Detects DSML (Hermes Agent tool-call) markup in model output.
 *
 * DSML looks like: < | | DSML | | invoke name="createBudget"...>
 * When deepseek-v4-flash fails to produce OpenAI-style tool_calls,
 * it sometimes outputs DSML as raw text instead.
 *
 * ponytail: naive regex — catches known DSML header patterns.
 * If Hermes changes DSML format, update the regex.
 */
const DSML_PATTERN = /<\s*\|\s*\|?\s*DSML\s*\|?\s*\|?\s*>/i;

export function containsDSMLMarkup(text: string | null | undefined): boolean {
  if (!text) return false;
  return DSML_PATTERN.test(text);
}
