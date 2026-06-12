import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerKey, getSupabaseUrl } from "@/lib/env";

export function createAdminClient() {
  const serverKey = getSupabaseServerKey();

  if (!serverKey) {
    return null;
  }

  return createClient(getSupabaseUrl(), serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
