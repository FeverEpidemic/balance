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

export function getPeriodRange(period: RekapPeriod): { start: string; end: string } {
  const now = new Date();
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

  const { data, error } = await admin.rpc("lookup_api_key", {
    lookup_hash: keyHash
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data as { id: string; user_id: string; key_hash: string; revoked_at: string | null };

  if (row.revoked_at) {
    return null;
  }

  // Best-effort touch last_used_at
  void admin.rpc("touch_api_key", { key_id: row.id }).then(
    () => {},
    () => {}
  );

  // Fetch the key name using admin client since we need info beyond the lookup function
  const { data: keyData, error: keyError } = await admin
    .from("user_api_keys")
    .select("name")
    .eq("id", row.id)
    .maybeSingle();

  const keyName = keyError || !keyData ? "API Key" : (keyData as { name: string }).name;

  return {
    userId: row.user_id,
    keyId: row.id,
    name: keyName
  };
}