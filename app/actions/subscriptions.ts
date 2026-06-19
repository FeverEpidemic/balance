"use server";

import { requireUser } from "@/lib/auth";
import { getTrimmedValue } from "@/app/actions/_shared";
import { createSnapTransaction } from "@/lib/midtrans/snap";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionPeriod } from "@/lib/plan-pricing";

const VALID_PERIODS: SubscriptionPeriod[] = ["monthly", "annual"];

export type CreateSubscriptionResult =
  | { data: { token: string; redirect_url: string } }
  | { error: string };

/**
 * Creates a new subscription by calling Midtrans Snap API.
 *
 * 1. Validates period and user session.
 * 2. Checks no active subscription exists.
 * 3. Generates unique order_id and calls Midtrans.
 * 4. Stores a pending subscription record.
 * 5. Returns the Snap token to the frontend.
 *
 * The frontend then calls snap.pay(token) to open the Midtrans popup.
 */
export async function createSubscription(formData: FormData): Promise<CreateSubscriptionResult> {
  const { user } = await requireUser();

  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  // 1. Parse & validate period
  const rawPeriod = getTrimmedValue(formData, "period");
  const period = VALID_PERIODS.includes(rawPeriod as SubscriptionPeriod)
    ? (rawPeriod as SubscriptionPeriod)
    : null;

  if (!period) {
    return { error: "Periode tidak valid. Pilih Bulanan atau Tahunan." };
  }

  // 2. Check user hasn't already got an active subscription
  const supabase = createAdminClient();
  if (!supabase) {
    return { error: "Server sedang sibuk. Silakan coba lagi." };
  }

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "active"])
    .maybeSingle();

  if (existingSub) {
    return {
      error:
        existingSub.status === "active"
          ? "Kamu sudah memiliki langganan Premium yang aktif."
          : "Kamu memiliki pembayaran yang masih menunggu. Silakan selesaikan pembayaran sebelumnya.",
    };
  }

  // 3. Get user profile for customer details
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { error: "Profil tidak ditemukan." };
  }

  // 4. Generate unique order_id
  const orderId = `BAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 5. Call Midtrans Snap API
  const snapResult = await createSnapTransaction({
    orderId,
    userId: user.id,
    email: profile.email,
    fullName: profile.full_name,
    period,
  });

  if (snapResult.error || !snapResult.data) {
    return { error: snapResult.error ?? "Gagal menghubungi server pembayaran." };
  }

  // 6. Store pending subscription in database
  const amount = period === "monthly" ? 29_000 : 250_000;

  const { error: insertError } = await supabase.from("subscriptions").insert({
    user_id: user.id,
    order_id: orderId,
    period,
    status: "pending",
    amount,
  });

  if (insertError) {
    console.error("[createSubscription] DB insert error:", insertError.message);
    // Transaction was created at Midtrans but DB insert failed.
    // The webhook will also try to insert when it arrives; if order_id already
    // exists the webhook will update it. This is a best-effort recovery path.
    return { error: "Gagal menyimpan pesanan. Silakan coba lagi." };
  }

  return { data: snapResult.data };
}

/**
 * Cancels a pending subscription by order_id.
 * Only works for subscriptions still in 'pending' status.
 */
export async function cancelSubscription(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const { user } = await requireUser();

  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  const orderId = getTrimmedValue(formData, "order_id");

  if (!orderId) {
    return { error: "Order ID tidak valid." };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { error: "Server sedang sibuk. Silakan coba lagi." };
  }

  const { data: sub, error: findError } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findError || !sub) {
    return { error: "Langganan tidak ditemukan." };
  }

  if (sub.status !== "pending") {
    return { error: "Hanya langganan dengan status pending yang bisa dibatalkan." };
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", sub.id);

  if (updateError) {
    console.error("[cancelSubscription] DB update error:", updateError.message);
    return { error: "Gagal membatalkan langganan." };
  }

  return { success: true };
}
