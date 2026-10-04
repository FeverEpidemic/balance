import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/midtrans/notification/route";

/**
 * Exercises the webhook route against a small in-memory stand-in for the
 * Supabase admin client, so idempotency and retry behaviour are covered
 * without a live database.
 */
const { db, failures, createFakeClient } = vi.hoisted(() => {
  type Row = Record<string, unknown>;
  type Result = { data: Row[] | null; error: { message: string } | null };

  const db: Record<string, Row[]> = {
    subscriptions: [],
    profiles: [],
    payment_notifications: [],
  };

  /** Queue of writes that should fail once, e.g. { table: "profiles", op: "update" }. */
  const failures: Array<{ table: string; op: string }> = [];

  class Query {
    private table: string;
    private filters: Array<(row: Row) => boolean> = [];
    private op: "select" | "insert" | "update" = "select";
    private values: Row = {};
    private returning = false;

    constructor(table: string) {
      this.table = table;
    }

    select(_columns?: string) {
      if (this.op !== "select") {
        this.returning = true;
      }
      return this;
    }

    insert(values: Row) {
      this.op = "insert";
      this.values = values;
      return this;
    }

    update(values: Row) {
      this.op = "update";
      this.values = values;
      return this;
    }

    eq(column: string, value: unknown) {
      this.filters.push((row) => row[column] === value);
      return this;
    }

    is(column: string, value: unknown) {
      this.filters.push((row) => (row[column] ?? null) === value);
      return this;
    }

    private async run(): Promise<Result> {
      // Yield once so concurrent requests interleave like real network calls.
      await Promise.resolve();

      const failureIndex = failures.findIndex((item) => item.table === this.table && item.op === this.op);
      if (failureIndex >= 0) {
        failures.splice(failureIndex, 1);
        return { data: null, error: { message: "injected failure" } };
      }

      const rows = db[this.table];

      if (this.op === "insert") {
        const isDuplicate =
          this.table === "payment_notifications" &&
          rows.some(
            (row) =>
              row.processed === false &&
              row.order_id === this.values.order_id &&
              row.transaction_id === this.values.transaction_id &&
              row.payment_status === this.values.payment_status
          );

        if (isDuplicate) {
          return { data: null, error: { message: "duplicate key value" } };
        }

        rows.push({ ...this.values });
        return { data: null, error: null };
      }

      const matched = rows.filter((row) => this.filters.every((filter) => filter(row)));

      if (this.op === "update") {
        matched.forEach((row) => Object.assign(row, this.values));
        return { data: this.returning ? matched.map((row) => ({ ...row })) : null, error: null };
      }

      return { data: matched.map((row) => ({ ...row })), error: null };
    }

    async maybeSingle() {
      const { data, error } = await this.run();
      return { data: data?.[0] ?? null, error };
    }

    then<T>(onFulfilled: (value: Result) => T, onRejected?: (reason: unknown) => T) {
      return this.run().then(onFulfilled, onRejected);
    }
  }

  return {
    db,
    failures,
    createFakeClient: () => ({ from: (table: string) => new Query(table) }),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createFakeClient(),
}));

vi.mock("@/lib/data/cache", () => ({
  invalidateSettingsCache: vi.fn(),
  invalidateShellDataCache: vi.fn(),
  invalidateDashboardCache: vi.fn(),
}));

const SERVER_KEY = "test-server-key";
const DAY_MS = 24 * 60 * 60 * 1000;

type SubscriptionFixture = {
  status: string;
  started_at: string | null;
  expires_at: string | null;
};

type ProfileFixture = {
  plan_type: string;
  trial_ends_at: string | null;
  subscription_expires_at: string | null;
};

function subscription() {
  return db.subscriptions[0] as SubscriptionFixture;
}

function profile() {
  return db.profiles[0] as ProfileFixture;
}

function buildNotification(overrides: Record<string, string> = {}) {
  const notification: Record<string, string> = {
    order_id: "BAL-TEST-1",
    status_code: "200",
    gross_amount: "29000.00",
    transaction_status: "settlement",
    transaction_id: "tx-1",
    payment_type: "gopay",
    ...overrides,
  };

  if (!overrides.signature_key) {
    notification.signature_key = crypto
      .createHash("sha512")
      .update(notification.order_id + notification.status_code + notification.gross_amount + SERVER_KEY)
      .digest("hex");
  }

  return notification;
}

async function send(notification: Record<string, string>) {
  const response = await POST(
    new Request("http://localhost/api/midtrans/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notification),
    })
  );

  return { status: response.status, body: (await response.json()) as { message: string } };
}

beforeEach(() => {
  process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;

  db.subscriptions.length = 0;
  db.profiles.length = 0;
  db.payment_notifications.length = 0;
  failures.length = 0;

  db.subscriptions.push({
    id: "sub-1",
    user_id: "user-1",
    order_id: "BAL-TEST-1",
    period: "monthly",
    status: "pending",
    amount: 29000,
    payment_channel: null,
    started_at: null,
    expires_at: null,
  });

  db.profiles.push({
    id: "user-1",
    plan_type: "free",
    trial_ends_at: null,
    subscription_expires_at: null,
  });

  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/midtrans/notification", () => {
  it("activates a pending order for one paid period on settlement", async () => {
    const result = await send(buildNotification());

    expect(result.status).toBe(200);
    expect(subscription().status).toBe("active");
    expect(profile().plan_type).toBe("premium");
    expect(profile().subscription_expires_at).toBe(subscription().expires_at);

    const span =
      new Date(subscription().expires_at ?? "").getTime() - new Date(subscription().started_at ?? "").getTime();
    expect(span).toBe(30 * DAY_MS);
    expect(db.payment_notifications[0].processed).toBe(true);
  });

  it("does not move the expiry when the same settlement is delivered again", async () => {
    await send(buildNotification());
    const firstExpiry = subscription().expires_at;

    await new Promise((resolve) => setTimeout(resolve, 15));
    const result = await send(buildNotification());

    expect(result.status).toBe(200);
    expect(subscription().expires_at).toBe(firstExpiry);
    expect(profile().subscription_expires_at).toBe(firstExpiry);
  });

  it("activates once when two deliveries race", async () => {
    const [first, second] = await Promise.all([send(buildNotification()), send(buildNotification())]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(subscription().status).toBe("active");
    expect(profile().subscription_expires_at).toBe(subscription().expires_at);
  });

  it("starts the paid period after an active trial", async () => {
    const trialEnd = new Date(Date.now() + 3 * DAY_MS).toISOString();
    profile().trial_ends_at = trialEnd;

    await send(buildNotification());

    expect(subscription().started_at).toBe(trialEnd);
  });

  it("refuses a correctly signed notification whose amount does not match the order", async () => {
    const result = await send(buildNotification({ gross_amount: "1.00" }));

    expect(result.status).toBe(200);
    expect(result.body.message).toBe("Amount mismatch");
    expect(subscription().status).toBe("pending");
    expect(profile().plan_type).toBe("free");
  });

  it("keeps a challenged card capture pending until it is accepted", async () => {
    await send(buildNotification({ transaction_status: "capture", fraud_status: "challenge", status_code: "201" }));

    expect(subscription().status).toBe("pending");
    expect(profile().plan_type).toBe("free");

    await send(buildNotification({ transaction_status: "capture", fraud_status: "accept" }));

    expect(subscription().status).toBe("active");
    expect(profile().plan_type).toBe("premium");
  });

  it("never downgrades a paid order on a late pending, expire or deny", async () => {
    await send(buildNotification());

    for (const transactionStatus of ["pending", "expire", "deny"]) {
      const result = await send(buildNotification({ transaction_status: transactionStatus, status_code: "201" }));

      expect(result.status).toBe(200);
      expect(subscription().status).toBe("active");
      expect(profile().plan_type).toBe("premium");
    }
  });

  it("grants nothing when a settlement is replayed after the period expired", async () => {
    await send(buildNotification());
    const originalExpiry = subscription().expires_at;

    // What process_expired_subscriptions() does once the period is over.
    subscription().status = "expired";
    profile().plan_type = "free";
    profile().subscription_expires_at = null;

    const result = await send(buildNotification());

    expect(result.status).toBe(200);
    expect(subscription().status).toBe("expired");
    expect(subscription().expires_at).toBe(originalExpiry);
    expect(profile().plan_type).toBe("free");
  });

  it("removes Premium when an active order is refunded", async () => {
    await send(buildNotification());
    const result = await send(buildNotification({ transaction_status: "refund" }));

    expect(result.status).toBe(200);
    expect(subscription().status).toBe("cancelled");
    expect(profile().plan_type).toBe("free");
    expect(profile().subscription_expires_at).toBeNull();
  });

  it("asks Midtrans to retry when the profile write fails, and the retry completes it", async () => {
    failures.push({ table: "profiles", op: "update" });

    const failed = await send(buildNotification());
    expect(failed.status).toBe(500);
    expect(subscription().status).toBe("active");
    expect(profile().plan_type).toBe("free");

    const expiry = subscription().expires_at;
    const retried = await send(buildNotification());

    expect(retried.status).toBe(200);
    expect(profile().plan_type).toBe("premium");
    expect(profile().subscription_expires_at).toBe(expiry);
    expect(subscription().expires_at).toBe(expiry);
  });

  it("asks Midtrans to retry when the subscription write fails, and the retry activates", async () => {
    failures.push({ table: "subscriptions", op: "update" });

    const failed = await send(buildNotification());
    expect(failed.status).toBe(500);
    expect(subscription().status).toBe("pending");

    const retried = await send(buildNotification());
    expect(retried.status).toBe(200);
    expect(subscription().status).toBe("active");
  });

  it("changes nothing for an invalid signature", async () => {
    const result = await send(buildNotification({ signature_key: "bogus" }));

    expect(result.status).toBe(200);
    expect(subscription().status).toBe("pending");
    expect(db.payment_notifications).toHaveLength(0);
  });

  it("expires an unpaid order and acknowledges an unknown order", async () => {
    await send(buildNotification({ transaction_status: "expire", status_code: "407" }));
    expect(subscription().status).toBe("expired");

    const result = await send(buildNotification({ order_id: "BAL-UNKNOWN" }));
    expect(result.status).toBe(200);
    expect(result.body.message).toBe("Order not found");
  });
});
