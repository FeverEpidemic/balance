import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function ensureProfileForUser(user: User) {
  const supabase = await createClient();
  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  const admin = createAdminClient();

  if (!admin) {
    return null;
  }

  const payload = {
    id: user.id,
    full_name: user.user_metadata.full_name ?? null,
    email: user.email ?? null,
    default_currency: "IDR"
  };

  const { data, error } = await admin.from("profiles").upsert(payload, { onConflict: "id" }).select("id").maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
