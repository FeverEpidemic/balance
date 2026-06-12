import type { User } from "@supabase/supabase-js";
import { defaultLocale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function ensureProfileForUser(user: User) {
  const supabase = await createClient();
  const { data: existingProfile } = await supabase.from("profiles").select("id, default_currency").eq("id", user.id).maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  const admin = createAdminClient();

  if (!admin) {
    return null;
  }

  const payload = {
    id: user.id,
    full_name: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
    email: user.email ?? null,
    preferred_locale: defaultLocale,
    default_currency: "IDR"
  };

  const { data, error } = await admin.from("profiles").upsert(payload, { onConflict: "id" }).select("id, default_currency").maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
