import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyNotificationSignature, isSuccessfulPayment, mapTransactionStatus, type MidtransNotification } from "@/lib/midtrans/verify";
import { getSubscriptionDurationDays, type SubscriptionPeriod, PREMIUM_MONTHLY_PRICE, PREMIUM_ANNUAL_PRICE } from "@/lib/plan-pricing";

/**
 * POST /api/midtrans/notification
 *
 * Midtrans Payment Notification URL (webhook).
 * Called by Midtrans after a transaction status changes.
 *
 * Must return 200 OK quickly — Midtrans will retry if not acknowledged.
 */
export async function POST(request: Request) {
  // 1. Parse raw body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
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

  const { order_id, transaction_status, status_code, gross_amount, payment_type, transaction_id, custom_field1 } = notification;

  if (!order_id || !transaction_status || !status_code) {
    console.warn("[midtrans-webhook] Missing required fields");
    return NextResponse.json({ message: "Missing required fields" }, { status: 200 });
  }

  // 3. Store raw notification (best-effort, for audit trail)
  const admin = createAdminClient();
  if (admin) {
    await admin.from("payment_notifications").insert({
      order_id,
      transaction_id: transaction_id ?? null,
      payment_status: transaction_status,
      raw_payload: rawBody,
      signature_verified: true,
      processed: false,
    }).maybeSingle();
  }

  // 4. Look up the subscription by order_id
  if (!admin) {
    console.error("[midtrans-webhook] No admin client available");
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }

  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .select("id, status, user_id, period")
    .eq("order_id", order_id)
    .maybeSingle();

  if (subError || !subscription) {
    console.warn("[midtrans-webhook] Subscription not found:", order_id);
    // Still return 200 to prevent Midtrans retries for unknown orders
    return NextResponse.json({ message: "Order not found" }, { status: 200 });
  }

  // 5. Mark notification as processed
  await admin
    .from("payment_notifications")
    .update({ processed: true })
    .eq("order_id", order_id)
    .eq("transaction_id", transaction_id ?? "")
    .maybeSingle();

  // 6. Handle successful payment
  if (isSuccessfulPayment(transaction_status)) {
    await handleSuccessfulPayment(admin, subscription, notification);
  } else {
    // 7. Handle non-successful statuses (expire, cancel, deny, pending, etc.)
    const mappedStatus = mapTransactionStatus(transaction_status);

    await admin
      .from("subscriptions")
      .update({ status: mappedStatus, payment_channel: payment_type ?? null })
      .eq("id", subscription.id);
  }

  return NextResponse.json({ message: "OK" }, { status: 200 });
}

/**
 * Process a successful Midtrans payment:
 * - Activate the subscription
 * - Handle trial overlap: if user has active trial, subscription starts after trial ends
 * - Update profile: plan_type = 'premium', subscription_expires_at = expires_at
 * - Invalidate relevant caches
 */
async function handleSuccessfulPayment(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  subscription: { id: string; user_id: string; period: string },
  notification: MidtransNotification
) {
  const { id: subscriptionId, user_id: userId, period } = subscription;
  const periodDays = getSubscriptionDurationDays(period as SubscriptionPeriod);
  const { payment_type, transaction_id } = notification;

  // Check if user has an active trial
  const { data: profile } = await admin
    .from("profiles")
    .select("trial_ends_at, subscription_expires_at")
    .eq("id", userId)
    .maybeSingle();

  // Calculate subscription start/end dates respecting trial overlap
  const now = new Date();
  let startedAt: Date;
  const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;

  if (trialEnd && trialEnd.getTime() > now.getTime()) {
    // User still has active trial — subscription starts after trial ends
    startedAt = trialEnd;
  } else {
    // No active trial — subscription starts now
    startedAt = now;
  }

  const expiresAt = new Date(startedAt.getTime() + periodDays * 24 * 60 * 60 * 1000);

  // Update subscription to active
  const { error: updateError } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      payment_channel: payment_type ?? null,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", subscriptionId);

  if (updateError) {
    console.error("[midtrans-webhook] Failed to update subscription:", updateError.message);
    return;
  }

  // Update profile: set plan_type to premium and record expiry
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      plan_type: "premium",
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    console.error("[midtrans-webhook] Failed to update profile:", profileError.message);
  }

  // Invalidate Redis caches for this user
  try {
    const { invalidateSettingsCache, invalidateShellDataCache, invalidateDashboardCache } = await import("@/lib/data/cache");
    await Promise.all([
      invalidateSettingsCache(userId),
      invalidateShellDataCache(userId),
      invalidateDashboardCache([userId]),
    ]);
  } catch (cacheError) {
    // Cache invalidation is best-effort
    console.warn("[midtrans-webhook] Cache invalidation failed (non-fatal):", cacheError);
  }

  console.info(
    `[midtrans-webhook] Subscription activated:`,
    `user=${userId}, order=${notification.order_id}, period=${period}, expires=${expiresAt.toISOString()}`
  );
}
