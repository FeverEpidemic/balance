import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyNotificationSignature, type MidtransNotification } from "@/lib/midtrans/verify";
import {
  computeSubscriptionWindow,
  isExpectedGrossAmount,
  resolveNotificationAction,
  type SubscriptionStatus,
} from "@/lib/midtrans/notification";
import { getSubscriptionDurationDays, type SubscriptionPeriod } from "@/lib/plan-pricing";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

type SubscriptionRow = {
  id: string;
  user_id: string;
  period: SubscriptionPeriod;
  status: SubscriptionStatus;
  amount: number | string;
  started_at: string | null;
  expires_at: string | null;
};

const SUBSCRIPTION_COLUMNS = "id, user_id, period, status, amount, started_at, expires_at";

/**
 * POST /api/midtrans/notification
 *
 * Midtrans Payment Notification URL (webhook).
 * Called by Midtrans after a transaction status changes.
 *
 * Midtrans may deliver the same notification more than once and in any order,
 * so every branch here is idempotent. The decision logic lives in
 * `lib/midtrans/notification.ts`.
 *
 * Responses:
 * - 200 for anything we have fully handled or deliberately ignored.
 * - 500 when a database write failed, so Midtrans retries the notification.
 */
export async function POST(request: Request) {
  // 1. Parse raw body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const notification = rawBody as MidtransNotification;

  // 2. Verify signature
  const { valid, reason } = verifyNotificationSignature(notification);
  if (!valid) {
    console.warn("[midtrans-webhook] Invalid signature:", reason, { order_id: notification.order_id });
    // Midtrans still expects 200 to stop retrying invalid notifications
    return NextResponse.json({ message: "Invalid signature" }, { status: 200 });
  }

  const { order_id, transaction_status, status_code, gross_amount, fraud_status, payment_type, transaction_id } =
    notification;

  if (!order_id || !transaction_status || !status_code) {
    console.warn("[midtrans-webhook] Missing required fields");
    return NextResponse.json({ message: "Missing required fields" }, { status: 200 });
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("[midtrans-webhook] No admin client available");
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }

  // 3. Store raw notification (best-effort, for audit trail).
  //    A duplicate delivery hits the dedup index and is skipped.
  await admin.from("payment_notifications").insert({
    order_id,
    transaction_id: transaction_id ?? null,
    payment_status: transaction_status,
    raw_payload: rawBody,
    signature_verified: true,
    processed: false,
  });

  // 4. Look up the subscription by order_id
  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("order_id", order_id)
    .maybeSingle<SubscriptionRow>();

  if (subError) {
    console.error("[midtrans-webhook] Failed to load subscription:", subError.message);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }

  if (!subscription) {
    console.warn("[midtrans-webhook] Subscription not found:", order_id);
    // Return 200 to prevent Midtrans retries for unknown orders
    return NextResponse.json({ message: "Order not found" }, { status: 200 });
  }

  // 5. Decide what this notification means for the order, then apply it.
  const action = resolveNotificationAction({
    transactionStatus: transaction_status,
    fraudStatus: typeof fraud_status === "string" ? fraud_status : null,
    subscriptionStatus: subscription.status,
    alreadyActivated: Boolean(subscription.started_at),
  });

  let ok = true;

  switch (action.type) {
    case "activate": {
      if (!isExpectedGrossAmount(gross_amount, subscription.amount)) {
        // Leave the notification unprocessed so it stands out for manual review.
        console.error("[midtrans-webhook] Paid amount does not match the order:", {
          order_id,
          gross_amount,
          expected: subscription.amount,
        });
        return NextResponse.json({ message: "Amount mismatch" }, { status: 200 });
      }

      ok = await activateSubscription(admin, subscription, notification);
      break;
    }

    case "sync_profile": {
      ok = await syncPremiumProfile(admin, subscription.user_id, subscription.expires_at);
      break;
    }

    case "set_status": {
      // Guarded by started_at so a concurrent activation is never overwritten.
      const { error } = await admin
        .from("subscriptions")
        .update({ status: action.status, payment_channel: payment_type ?? null })
        .eq("id", subscription.id)
        .is("started_at", null);

      if (error) {
        console.error("[midtrans-webhook] Failed to update subscription status:", error.message);
        ok = false;
      }
      break;
    }

    case "revoke": {
      ok = await revokeSubscription(admin, subscription, transaction_status);
      break;
    }

    case "ignore": {
      console.info(`[midtrans-webhook] Ignored ${transaction_status} for order=${order_id}: ${action.reason}`);
      break;
    }
  }

  if (!ok) {
    // Ask Midtrans to retry. Every branch above is safe to run again.
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }

  // 6. Mark this notification as processed
  let processedQuery = admin
    .from("payment_notifications")
    .update({ processed: true })
    .eq("order_id", order_id)
    .eq("payment_status", transaction_status)
    .eq("processed", false);

  processedQuery = transaction_id
    ? processedQuery.eq("transaction_id", transaction_id)
    : processedQuery.is("transaction_id", null);

  await processedQuery;

  return NextResponse.json({ message: "OK" }, { status: 200 });
}

/**
 * Activate a paid order exactly once.
 *
 * The subscription update is conditional on `started_at IS NULL`, so when two
 * deliveries of the same notification race, only one of them writes the dates
 * and the other falls through to a profile re-sync.
 */
async function activateSubscription(
  admin: AdminClient,
  subscription: SubscriptionRow,
  notification: MidtransNotification
): Promise<boolean> {
  const { id: subscriptionId, user_id: userId, period } = subscription;

  const { data: profile, error: profileReadError } = await admin
    .from("profiles")
    .select("trial_ends_at, subscription_expires_at")
    .eq("id", userId)
    .maybeSingle<{ trial_ends_at: string | null; subscription_expires_at: string | null }>();

  if (profileReadError) {
    console.error("[midtrans-webhook] Failed to load profile:", profileReadError.message);
    return false;
  }

  // The paid period starts after any Premium time the user already has
  // (an active trial or a still-running paid period).
  const { startedAt, expiresAt } = computeSubscriptionWindow({
    now: new Date(),
    periodDays: getSubscriptionDurationDays(period),
    trialEndsAt: profile?.trial_ends_at ?? null,
    currentExpiresAt: profile?.subscription_expires_at ?? null,
  });

  const { data: activated, error: updateError } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      payment_channel: notification.payment_type ?? null,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", subscriptionId)
    .is("started_at", null)
    .select("id, expires_at");

  if (updateError) {
    console.error("[midtrans-webhook] Failed to update subscription:", updateError.message);
    return false;
  }

  if (!activated || activated.length === 0) {
    // Another delivery of this notification activated the order first.
    const { data: current, error: currentError } = await admin
      .from("subscriptions")
      .select("status, expires_at")
      .eq("id", subscriptionId)
      .maybeSingle<{ status: SubscriptionStatus; expires_at: string | null }>();

    if (currentError) {
      console.error("[midtrans-webhook] Failed to reload subscription:", currentError.message);
      return false;
    }

    if (current?.status !== "active") {
      return true;
    }

    return syncPremiumProfile(admin, userId, current.expires_at);
  }

  const synced = await syncPremiumProfile(admin, userId, expiresAt.toISOString());

  if (synced) {
    console.info(
      `[midtrans-webhook] Subscription activated:`,
      `user=${userId}, order=${notification.order_id}, period=${period}, expires=${expiresAt.toISOString()}`
    );
  }

  return synced;
}

/**
 * Make the profile reflect an active subscription. Safe to call repeatedly:
 * it always writes the same values for the same subscription.
 */
async function syncPremiumProfile(admin: AdminClient, userId: string, expiresAt: string | null): Promise<boolean> {
  if (!expiresAt) {
    console.error("[midtrans-webhook] Active subscription has no expiry date:", userId);
    return false;
  }

  const { error } = await admin
    .from("profiles")
    .update({
      plan_type: "premium",
      subscription_expires_at: expiresAt,
    })
    .eq("id", userId);

  if (error) {
    console.error("[midtrans-webhook] Failed to update profile:", error.message);
    return false;
  }

  await invalidateUserCaches(userId);

  return true;
}

/**
 * Undo an activation after a refund, chargeback, or voided capture:
 * put the profile back on the Free plan and cancel the subscription.
 *
 * The profile is updated first. If the second write fails the subscription is
 * still `active`, so the retried notification runs this again and finishes.
 */
async function revokeSubscription(
  admin: AdminClient,
  subscription: SubscriptionRow,
  transactionStatus: string
): Promise<boolean> {
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      plan_type: "free",
      subscription_expires_at: null,
    })
    .eq("id", subscription.user_id);

  if (profileError) {
    console.error("[midtrans-webhook] Failed to downgrade profile:", profileError.message);
    return false;
  }

  const { error: updateError } = await admin
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscription.id);

  if (updateError) {
    console.error("[midtrans-webhook] Failed to cancel subscription:", updateError.message);
    return false;
  }

  await invalidateUserCaches(subscription.user_id);

  console.info(
    `[midtrans-webhook] Subscription revoked:`,
    `user=${subscription.user_id}, subscription=${subscription.id}, reason=${transactionStatus}`
  );

  return true;
}

/** Redis cache invalidation is best-effort and never fails the webhook. */
async function invalidateUserCaches(userId: string) {
  try {
    const { invalidateSettingsCache, invalidateShellDataCache, invalidateDashboardCache } = await import(
      "@/lib/data/cache"
    );
    await Promise.all([
      invalidateSettingsCache(userId),
      invalidateShellDataCache(userId),
      invalidateDashboardCache([userId]),
    ]);
  } catch (cacheError) {
    console.warn("[midtrans-webhook] Cache invalidation failed (non-fatal):", cacheError);
  }
}
