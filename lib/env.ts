function readEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
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

export function getSmtpConfig() {
  const host = readOptionalEnv("SMTP_HOST");
  const port = readOptionalEnv("SMTP_PORT");
  const from = readOptionalEnv("SMTP_FROM");
  const user = readOptionalEnv("SMTP_USER");
  const pass = readOptionalEnv("SMTP_PASS");
  const secure = readOptionalEnv("SMTP_SECURE");

  if (!host && !port && !from && !user && !pass && !secure) {
    return null;
  }

  if (!host || !port || !from) {
    throw new Error("SMTP belum lengkap. Isi SMTP_HOST, SMTP_PORT, dan SMTP_FROM.");
  }

  if ((user && !pass) || (!user && pass)) {
    throw new Error("SMTP auth harus mengisi SMTP_USER dan SMTP_PASS secara berpasangan.");
  }

  const parsedPort = Number(port);

  if (!Number.isFinite(parsedPort)) {
    throw new Error("SMTP_PORT harus berupa angka.");
  }

  return {
    host,
    port: parsedPort,
    from,
    secure: secure ? secure === "true" : parsedPort === 465,
    auth: user && pass ? { user, pass } : undefined
  };
}
