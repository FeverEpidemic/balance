export function sanitizeRedirectPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next) {
    return fallback;
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

export function withAuthMessage(
  path: string,
  key: "error" | "message",
  value: string,
  next?: string | null,
  fallbackNext = "/dashboard"
) {
  const params = new URLSearchParams({ [key]: value });
  const safeNext = sanitizeRedirectPath(next, fallbackNext);

  if (safeNext !== fallbackNext) {
    params.set("next", safeNext);
  }

  return `${path}?${params.toString()}`;
}
