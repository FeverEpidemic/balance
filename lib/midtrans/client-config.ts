/**
 * Client-safe Midtrans configuration.
 * These values use NEXT_PUBLIC_ env vars and are safe to expose to the browser.
 */

/**
 * Returns the client key for Midtrans Snap.js.
 */
export function getMidtransClientKey(): string {
  return process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
}

/**
 * Snap.js URL — uses a public env var or defaults to sandbox.
 * We read the public toggle so the client knows which Snap endpoint to use.
 */
export function getMidtransSnapJsUrl(): string {
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  return isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}
