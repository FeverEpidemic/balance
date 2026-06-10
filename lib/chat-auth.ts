import "server-only";
import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const API_KEY_PREFIX = "bal_";

export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const randomPart = randomBytes(32).toString("base64url");
  const rawKey = `${API_KEY_PREFIX}${randomPart}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);
  return { rawKey, keyHash, keyPrefix };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export type RekapPeriod = "day" | "week" | "month";

export function getPeriodRange(period: RekapPeriod, nowInput?: Date): { start: string; end: string } {
  const now = nowInput ?? new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  if (period === "day") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (period === "week") {
    const dayOfWeek = now.getUTCDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff, 0, 0, 0, 0));
    return { start: monday.toISOString(), end: end.toISOString() };
  }

  // month (default)
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

export function getPreviousPeriodRange(period: RekapPeriod, nowInput?: Date): { start: string; end: string } {
  const now = nowInput ?? new Date();

  if (period === "day") {
    const previousDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    return getPeriodRange("day", previousDay);
  }

  if (period === "week") {
    const currentDayOfWeek = now.getUTCDay();
    const diffToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const previousWeekReference = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds())
    );
    const previousWeekMonday = new Date(
      Date.UTC(
        previousWeekReference.getUTCFullYear(),
        previousWeekReference.getUTCMonth(),
        previousWeekReference.getUTCDate() - diffToMonday,
        0,
        0,
        0,
        0
      )
    );
    const previousWeekComparableEnd = new Date(
      Date.UTC(
        previousWeekMonday.getUTCFullYear(),
        previousWeekMonday.getUTCMonth(),
        previousWeekMonday.getUTCDate() + diffToMonday,
        23,
        59,
        59,
        999
      )
    );

    return {
      start: previousWeekMonday.toISOString(),
      end: previousWeekComparableEnd.toISOString()
    };
  }

  const previousMonth = now.getUTCMonth() - 1;
  const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), previousMonth, 1, 0, 0, 0, 0));
  const lastDayOfPreviousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();
  const comparableDay = Math.min(now.getUTCDate(), lastDayOfPreviousMonth);
  const previousMonthEnd = new Date(
    Date.UTC(previousMonthStart.getUTCFullYear(), previousMonthStart.getUTCMonth(), comparableDay, 23, 59, 59, 999)
  );

  return {
    start: previousMonthStart.toISOString(),
    end: previousMonthEnd.toISOString()
  };
}

export async function verifyApiKey(header: string | null): Promise<{ userId: string; keyId: string; name: string } | null> {
  if (!header) {
    return null;
  }

  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  const rawKey = parts[1];

  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);
  const admin = createAdminClient();

  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from("user_api_keys")
    .select("id, user_id, name, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { id: string; user_id: string; name: string; revoked_at: string | null };

  if (row.revoked_at) {
    return null;
  }

  // Best-effort touch last_used_at
  void admin
    .from("user_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id)
    .then(
    () => {},
    () => {}
  );

  return {
    userId: row.user_id,
    keyId: row.id,
    name: row.name
  };
}
