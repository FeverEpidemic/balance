function readEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  return value;
}

export function getSupabasePublishableKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return value;
}

export function getSupabaseServerKey() {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_SITE_URL ?? "http://localhost:3000";
}

export function getRedisUrl() {
  return process.env.REDIS_URL?.trim() || null;
}

export function getRedisEnabled() {
  return process.env.REDIS_ENABLED?.trim() || null;
}

export function getRedisKeyPrefix() {
  return process.env.REDIS_KEY_PREFIX?.trim() || "balance";
}

function readBooleanEnv(name: string, defaultValue: boolean) {
  const rawValue = process.env[name]?.trim().toLowerCase();

  if (!rawValue) {
    return defaultValue;
  }

  if (["1", "true", "on", "yes"].includes(rawValue)) {
    return true;
  }

  if (["0", "false", "off", "no"].includes(rawValue)) {
    return false;
  }

  return defaultValue;
}

function readPositiveIntegerEnv(name: string, defaultValue: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return parsed;
}

export function getChatApiRateLimitEnabled() {
  return readBooleanEnv("CHAT_API_RATE_LIMIT_ENABLED", true);
}

export function getChatApiRateLimitMaxRequests() {
  return readPositiveIntegerEnv("CHAT_API_RATE_LIMIT_MAX_REQUESTS", 60);
}

export function getChatApiRateLimitWindowSeconds() {
  return readPositiveIntegerEnv("CHAT_API_RATE_LIMIT_WINDOW_SECONDS", 60);
}
