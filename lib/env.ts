function readEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseUrl() {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
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
