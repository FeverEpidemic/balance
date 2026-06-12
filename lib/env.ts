import { DEFAULT_CHAT_TOKEN_BUDGET } from "@/lib/ai/token-budget";

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
  const value = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_SITE_URL;

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SITE_URL or APP_SITE_URL");
  }

  return value;
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

export function getAiChatEnabled() {
  return readBooleanEnv("AI_CHAT_ENABLED", true);
}

export function getFreeTierMaxMonthlyTransactions() {
  return readPositiveIntegerEnv("FREE_TIER_MAX_MONTHLY_TRANSACTIONS", 20);
}

export function getTransactionRateLimitEnabled() {
  return readBooleanEnv("TRANSACTION_RATE_LIMIT_ENABLED", true);
}

export function getTransactionRateLimitMaxRequests() {
  return readPositiveIntegerEnv("TRANSACTION_RATE_LIMIT_MAX_REQUESTS", 30);
}

export function getTransactionRateLimitWindowSeconds() {
  return readPositiveIntegerEnv("TRANSACTION_RATE_LIMIT_WINDOW_SECONDS", 60);
}

export function getAiChatRateLimitEnabled() {
  return readBooleanEnv("AI_CHAT_RATE_LIMIT_ENABLED", true);
}

export function getAiChatRateLimitMaxRequests() {
  return readPositiveIntegerEnv("AI_CHAT_RATE_LIMIT_MAX_REQUESTS", 20);
}

export function getAiChatRateLimitWindowSeconds() {
  return readPositiveIntegerEnv("AI_CHAT_RATE_LIMIT_WINDOW_SECONDS", 60);
}

export function getAiChatModel() {
  return process.env.AI_CHAT_MODEL?.trim() || "deepseek-v4-flash";
}

export function getDeepseekBaseUrl() {
  return process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com/v1";
}

export function getDeepseekApiKey() {
  return process.env.DEEPSEEK_API_KEY?.trim() || null;
}

export function getDailySpendingCapEnabled() {
  return readBooleanEnv("DAILY_SPENDING_CAP_ENABLED", false);
}

export function getDailySpendingCapAmount() {
  return readPositiveIntegerEnv("DAILY_SPENDING_CAP_AMOUNT", 5_000_000);
}

export function getAiChatTokenBudget() {
  return readPositiveIntegerEnv("AI_CHAT_TOKEN_BUDGET", DEFAULT_CHAT_TOKEN_BUDGET);
}

export function getAiChatDailyLimitEnabled() {
  return readBooleanEnv("AI_CHAT_DAILY_LIMIT_ENABLED", true);
}

export function getAiChatDailyLimitMax() {
  return readPositiveIntegerEnv("AI_CHAT_DAILY_LIMIT_MAX", 20);
}
