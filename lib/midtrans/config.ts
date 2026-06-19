import "server-only";

import {
  getMidtransServerKey,
  getMidtransMerchantId,
  getMidtransIsProduction,
  getMidtransWebhookSecret,
} from "@/lib/env";

/** Base URL for Midtrans Snap API (server-to-server). */
export function getMidtransApiBaseUrl(): string {
  return getMidtransIsProduction()
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";
}

/** Base URL for Midtrans Transaction Status API. */
export function getMidtransTransactionBaseUrl(): string {
  return getMidtransIsProduction()
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";
}

/** Snap.js URL for client-side embedding. */
export function getMidtransSnapJsUrl(): string {
  return getMidtransIsProduction()
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

/** Basic auth header for Midtrans API calls. */
export function getMidtransAuthHeader(): string {
  const key = getMidtransServerKey();
  return `Basic ${Buffer.from(key).toString("base64")}`;
}

export {
  getMidtransServerKey,
  getMidtransMerchantId,
  getMidtransIsProduction,
  getMidtransWebhookSecret,
};
