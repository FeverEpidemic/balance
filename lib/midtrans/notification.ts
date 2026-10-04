import "server-only";

/**
 * Pure decision logic for the Midtrans payment notification webhook.
 *
 * Everything here is deterministic and free of I/O so it can be unit tested
 * without Supabase. The route handler in `app/api/midtrans/notification`
 * reads the current subscription row, asks this module what to do, and then
 * performs the database writes.
 */

export type SubscriptionStatus = "pending" | "active" | "expired" | "cancelled";

export type NotificationAction =
  /** First successful payment for this order: activate the subscription. */
  | { type: "activate" }
  /** Repeated success for an order that is already active: only re-sync the profile. */
  | { type: "sync_profile" }
  /** Order was never paid: record the new non-active status. */
  | { type: "set_status"; status: "pending" | "expired" | "cancelled" }
  /** Payment was reversed after activation: cancel and remove Premium. */
  | { type: "revoke" }
  /** Nothing to change. */
  | { type: "ignore"; reason: string };

export type NotificationContext = {
  /** Midtrans `transaction_status`. */
  transactionStatus: string;
  /** Midtrans `fraud_status` (card payments). */
  fraudStatus?: string | null;
  /** Current `subscriptions.status`. */
  subscriptionStatus: SubscriptionStatus;
  /** True when `subscriptions.started_at` is set, i.e. the order was activated before. */
  alreadyActivated: boolean;
};

/** Statuses that close an order that was never paid. */
const UNPAID_CLOSING_STATUSES = new Set(["deny", "cancel", "failure", "refund", "chargeback"]);

/**
 * Statuses that take back a payment we already accepted: a full refund, a
 * chargeback, or a card capture that was voided before settlement.
 *
 * `deny` and `failure` are deliberately excluded. Snap lets a customer retry
 * the same order with another payment method, so a failed first attempt can be
 * delivered after the successful one and must not remove Premium.
 */
const REVERSAL_STATUSES = new Set(["refund", "chargeback", "cancel"]);

/** Statuses that return only part of the payment; these need a human decision. */
const PARTIAL_REVERSAL_STATUSES = new Set(["partial_refund", "partial_chargeback"]);

/**
 * Whether a notification represents money that has actually been received.
 *
 * `settlement` is final. `capture` (card payments) only counts once Midtrans'
 * fraud detection has accepted it; a `challenge` capture is still awaiting
 * manual review and must not unlock Premium.
 */
export function isSuccessfulPayment(status: string, fraudStatus?: string | null): boolean {
  if (status === "settlement") {
    return true;
  }

  return status === "capture" && fraudStatus === "accept";
}

/**
 * Decides what the webhook should do with a verified notification.
 *
 * The rules make the handler idempotent and safe against out-of-order or
 * replayed notifications:
 * - An order is activated at most once (guarded by `started_at`).
 * - A late `pending`/`expire` never downgrades an order that was already paid.
 * - A replayed success for an order that has since expired or been cancelled
 *   does not grant a new period.
 */
export function resolveNotificationAction(context: NotificationContext): NotificationAction {
  const { transactionStatus, fraudStatus, subscriptionStatus, alreadyActivated } = context;

  if (isSuccessfulPayment(transactionStatus, fraudStatus)) {
    if (!alreadyActivated) {
      return { type: "activate" };
    }

    if (subscriptionStatus === "active") {
      return { type: "sync_profile" };
    }

    return { type: "ignore", reason: `order already activated earlier and is now ${subscriptionStatus}` };
  }

  if (PARTIAL_REVERSAL_STATUSES.has(transactionStatus)) {
    return { type: "ignore", reason: `${transactionStatus} needs manual review` };
  }

  if (alreadyActivated) {
    if (REVERSAL_STATUSES.has(transactionStatus) && subscriptionStatus === "active") {
      return { type: "revoke" };
    }

    return {
      type: "ignore",
      reason: `${transactionStatus} for an order that was already paid and is now ${subscriptionStatus}`,
    };
  }

  if (subscriptionStatus !== "pending") {
    return { type: "ignore", reason: `order is already ${subscriptionStatus}` };
  }

  if (UNPAID_CLOSING_STATUSES.has(transactionStatus)) {
    return { type: "set_status", status: "cancelled" };
  }

  if (transactionStatus === "expire") {
    return { type: "set_status", status: "expired" };
  }

  // pending, capture awaiting fraud review, authorize, or an unknown status.
  return { type: "set_status", status: "pending" };
}

/**
 * Compares the amount Midtrans reports with the amount stored for the order.
 * Midtrans sends `gross_amount` as a string such as "29000.00".
 */
export function isExpectedGrossAmount(
  grossAmount: string | number | null | undefined,
  expectedAmount: string | number | null | undefined
): boolean {
  if (grossAmount === null || grossAmount === undefined || grossAmount === "") {
    return false;
  }

  if (expectedAmount === null || expectedAmount === undefined || expectedAmount === "") {
    return false;
  }

  const paid = Number(grossAmount);
  const expected = Number(expectedAmount);

  if (!Number.isFinite(paid) || !Number.isFinite(expected) || expected <= 0) {
    return false;
  }

  return Math.abs(paid - expected) < 0.005;
}

export type SubscriptionWindowInput = {
  now: Date;
  periodDays: number;
  /** `profiles.trial_ends_at` */
  trialEndsAt?: string | null;
  /** `profiles.subscription_expires_at` */
  currentExpiresAt?: string | null;
};

export type SubscriptionWindow = {
  startedAt: Date;
  expiresAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toFutureTime(value: string | null | undefined, nowMs: number): number | null {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) && time > nowMs ? time : null;
}

/**
 * Calculates when a newly paid period starts and ends.
 *
 * The period starts after any Premium time the user already has, so a
 * running free trial or a still-valid paid period is never cut short.
 */
export function computeSubscriptionWindow(input: SubscriptionWindowInput): SubscriptionWindow {
  const nowMs = input.now.getTime();
  const startMs = Math.max(
    nowMs,
    toFutureTime(input.trialEndsAt, nowMs) ?? nowMs,
    toFutureTime(input.currentExpiresAt, nowMs) ?? nowMs
  );

  return {
    startedAt: new Date(startMs),
    expiresAt: new Date(startMs + input.periodDays * DAY_MS),
  };
}
