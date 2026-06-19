import "server-only";

import { getMidtransApiBaseUrl, getMidtransAuthHeader } from "@/lib/midtrans/config";
import type { SubscriptionPeriod } from "@/lib/plan-pricing";
import { buildSnapItemDetails, PREMIUM_MONTHLY_PRICE, PREMIUM_ANNUAL_PRICE } from "@/lib/plan-pricing";

export type SnapTransactionParams = {
  orderId: string;
  userId: string;
  email: string;
  fullName: string | null;
  period: SubscriptionPeriod;
};

export type SnapTransactionResult = {
  token: string;
  redirect_url: string;
};

export type MidtransError = {
  status_code: string;
  status_message: string;
};

/**
 * Creates a Midtrans Snap transaction and returns the snap token + redirect URL.
 *
 * This is a server-side API call to Midtrans Core API / Snap v1.
 * The returned token is used client-side to open the Snap payment popup.
 */
export async function createSnapTransaction(
  params: SnapTransactionParams
): Promise<{ data?: SnapTransactionResult; error?: string }> {
  const { orderId, userId, email, fullName, period } = params;
  const amount = period === "monthly" ? PREMIUM_MONTHLY_PRICE : PREMIUM_ANNUAL_PRICE;
  const itemDetails = buildSnapItemDetails(period);

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: itemDetails,
    customer_details: {
      first_name: fullName ?? "User",
      email,
      phone: "",
    },
    credit_card: {
      secure: true,
    },
    // Custom field to link back to user — Midtrans passes this back in the notification
    custom_field1: userId,
  };

  const baseUrl = getMidtransApiBaseUrl();
  const authHeader = getMidtransAuthHeader();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[createSnapTransaction] Network error:", err);
    return { error: "Gagal terhubung ke server pembayaran. Silakan coba lagi." };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const errMsg = body?.status_message ?? `Midtrans API error (${response.status})`;
    console.error("[createSnapTransaction] API error:", response.status, body);
    return { error: errMsg };
  }

  const body = await response.json();
  const token = body.token as string | undefined;
  const redirectUrl = body.redirect_url as string | undefined;

  if (!token || !redirectUrl) {
    console.error("[createSnapTransaction] Missing token or redirect_url in response:", body);
    return { error: "Respons dari server pembayaran tidak valid." };
  }

  return { data: { token, redirect_url: redirectUrl } };
}
