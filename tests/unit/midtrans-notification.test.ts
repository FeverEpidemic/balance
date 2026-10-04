import { describe, it, expect } from "vitest";
import {
  computeSubscriptionWindow,
  isExpectedGrossAmount,
  isSuccessfulPayment,
  resolveNotificationAction,
} from "@/lib/midtrans/notification";

describe("isSuccessfulPayment", () => {
  it("returns true for settlement", () => {
    expect(isSuccessfulPayment("settlement")).toBe(true);
  });

  it("returns true for capture accepted by fraud detection", () => {
    expect(isSuccessfulPayment("capture", "accept")).toBe(true);
  });

  it("returns false for capture under fraud challenge", () => {
    expect(isSuccessfulPayment("capture", "challenge")).toBe(false);
  });

  it("returns false for capture without a fraud status", () => {
    expect(isSuccessfulPayment("capture")).toBe(false);
  });

  it("returns false for non-paid statuses", () => {
    for (const status of ["pending", "expire", "deny", "cancel", "refund", "failure"]) {
      expect(isSuccessfulPayment(status, "accept")).toBe(false);
    }
  });
});

describe("resolveNotificationAction", () => {
  it("activates a pending order on settlement", () => {
    expect(
      resolveNotificationAction({
        transactionStatus: "settlement",
        subscriptionStatus: "pending",
        alreadyActivated: false,
      })
    ).toEqual({ type: "activate" });
  });

  it("activates an order the user cancelled in-app but still paid", () => {
    expect(
      resolveNotificationAction({
        transactionStatus: "settlement",
        subscriptionStatus: "cancelled",
        alreadyActivated: false,
      })
    ).toEqual({ type: "activate" });
  });

  it("only re-syncs the profile for a duplicate settlement", () => {
    expect(
      resolveNotificationAction({
        transactionStatus: "settlement",
        subscriptionStatus: "active",
        alreadyActivated: true,
      })
    ).toEqual({ type: "sync_profile" });
  });

  it("does not grant a new period when a settlement is replayed after expiry", () => {
    const action = resolveNotificationAction({
      transactionStatus: "settlement",
      subscriptionStatus: "expired",
      alreadyActivated: true,
    });

    expect(action.type).toBe("ignore");
  });

  it("keeps a challenged capture pending", () => {
    expect(
      resolveNotificationAction({
        transactionStatus: "capture",
        fraudStatus: "challenge",
        subscriptionStatus: "pending",
        alreadyActivated: false,
      })
    ).toEqual({ type: "set_status", status: "pending" });
  });

  it("activates a capture accepted by fraud detection", () => {
    expect(
      resolveNotificationAction({
        transactionStatus: "capture",
        fraudStatus: "accept",
        subscriptionStatus: "pending",
        alreadyActivated: false,
      })
    ).toEqual({ type: "activate" });
  });

  it("does not downgrade a paid order on a late pending notification", () => {
    const action = resolveNotificationAction({
      transactionStatus: "pending",
      subscriptionStatus: "active",
      alreadyActivated: true,
    });

    expect(action.type).toBe("ignore");
  });

  it("does not downgrade a paid order on a late expire notification", () => {
    const action = resolveNotificationAction({
      transactionStatus: "expire",
      subscriptionStatus: "active",
      alreadyActivated: true,
    });

    expect(action.type).toBe("ignore");
  });

  it("expires an unpaid pending order", () => {
    expect(
      resolveNotificationAction({
        transactionStatus: "expire",
        subscriptionStatus: "pending",
        alreadyActivated: false,
      })
    ).toEqual({ type: "set_status", status: "expired" });
  });

  it("cancels an unpaid pending order on deny, cancel and failure", () => {
    for (const transactionStatus of ["deny", "cancel", "failure"]) {
      expect(
        resolveNotificationAction({
          transactionStatus,
          subscriptionStatus: "pending",
          alreadyActivated: false,
        })
      ).toEqual({ type: "set_status", status: "cancelled" });
    }
  });

  it("does not reopen an order the user already cancelled", () => {
    const action = resolveNotificationAction({
      transactionStatus: "pending",
      subscriptionStatus: "cancelled",
      alreadyActivated: false,
    });

    expect(action.type).toBe("ignore");
  });

  it("revokes Premium when an active order is refunded, charged back or cancelled", () => {
    for (const transactionStatus of ["refund", "chargeback", "cancel"]) {
      expect(
        resolveNotificationAction({
          transactionStatus,
          subscriptionStatus: "active",
          alreadyActivated: true,
        })
      ).toEqual({ type: "revoke" });
    }
  });

  it("keeps Premium when a failed earlier attempt arrives after the successful one", () => {
    for (const transactionStatus of ["deny", "failure"]) {
      const action = resolveNotificationAction({
        transactionStatus,
        subscriptionStatus: "active",
        alreadyActivated: true,
      });

      expect(action.type).toBe("ignore");
    }
  });

  it("does not revoke twice", () => {
    const action = resolveNotificationAction({
      transactionStatus: "refund",
      subscriptionStatus: "cancelled",
      alreadyActivated: true,
    });

    expect(action.type).toBe("ignore");
  });

  it("leaves partial refunds for manual review", () => {
    const action = resolveNotificationAction({
      transactionStatus: "partial_refund",
      subscriptionStatus: "active",
      alreadyActivated: true,
    });

    expect(action.type).toBe("ignore");
  });

  it("keeps an unknown status pending", () => {
    expect(
      resolveNotificationAction({
        transactionStatus: "something_new",
        subscriptionStatus: "pending",
        alreadyActivated: false,
      })
    ).toEqual({ type: "set_status", status: "pending" });
  });
});

describe("isExpectedGrossAmount", () => {
  it("accepts the Midtrans string format", () => {
    expect(isExpectedGrossAmount("29000.00", 29000)).toBe(true);
  });

  it("accepts a numeric column returned as a string", () => {
    expect(isExpectedGrossAmount("250000.00", "250000.00")).toBe(true);
  });

  it("rejects a different amount", () => {
    expect(isExpectedGrossAmount("1.00", 29000)).toBe(false);
    expect(isExpectedGrossAmount("29000.00", 250000)).toBe(false);
  });

  it("rejects missing or malformed values", () => {
    expect(isExpectedGrossAmount("", 29000)).toBe(false);
    expect(isExpectedGrossAmount("abc", 29000)).toBe(false);
    expect(isExpectedGrossAmount(undefined, 29000)).toBe(false);
    expect(isExpectedGrossAmount("29000.00", null)).toBe(false);
    expect(isExpectedGrossAmount("0", 0)).toBe(false);
  });
});

describe("computeSubscriptionWindow", () => {
  const now = new Date("2026-07-01T00:00:00.000Z");

  it("starts now when the user has no remaining Premium time", () => {
    const window = computeSubscriptionWindow({ now, periodDays: 30 });

    expect(window.startedAt.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(window.expiresAt.toISOString()).toBe("2026-07-31T00:00:00.000Z");
  });

  it("starts after an active trial ends", () => {
    const window = computeSubscriptionWindow({
      now,
      periodDays: 30,
      trialEndsAt: "2026-07-05T00:00:00.000Z",
    });

    expect(window.startedAt.toISOString()).toBe("2026-07-05T00:00:00.000Z");
    expect(window.expiresAt.toISOString()).toBe("2026-08-04T00:00:00.000Z");
  });

  it("ignores a trial that already ended", () => {
    const window = computeSubscriptionWindow({
      now,
      periodDays: 30,
      trialEndsAt: "2026-06-01T00:00:00.000Z",
    });

    expect(window.startedAt.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("continues from a paid period that is still running", () => {
    const window = computeSubscriptionWindow({
      now,
      periodDays: 365,
      currentExpiresAt: "2026-07-11T00:00:00.000Z",
    });

    expect(window.startedAt.toISOString()).toBe("2026-07-11T00:00:00.000Z");
    expect(window.expiresAt.toISOString()).toBe("2027-07-11T00:00:00.000Z");
  });

  it("uses the later of trial end and current expiry", () => {
    const window = computeSubscriptionWindow({
      now,
      periodDays: 30,
      trialEndsAt: "2026-07-05T00:00:00.000Z",
      currentExpiresAt: "2026-07-03T00:00:00.000Z",
    });

    expect(window.startedAt.toISOString()).toBe("2026-07-05T00:00:00.000Z");
  });

  it("ignores invalid dates", () => {
    const window = computeSubscriptionWindow({
      now,
      periodDays: 30,
      trialEndsAt: "not-a-date",
    });

    expect(window.startedAt.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });
});
