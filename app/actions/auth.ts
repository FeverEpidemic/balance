"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/profile";
import { getSiteUrl } from "@/lib/env";

function toMessage(path: string, key: "error" | "message", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return `${path}?${params.toString()}`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(toMessage("/login", "error", error.message));
  }

  if (data.user) {
    await ensureProfileForUser(data.user);
  }

  revalidatePath("/", "layout");
  redirect(next || "/dashboard");
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? getSiteUrl();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`
    }
  });

  if (error) {
    redirect(toMessage("/register", "error", error.message));
  }

  if (data.user) {
    await ensureProfileForUser(data.user);
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/wallets?message=Akun aktif. Buat wallet pertama Anda.");
  }

  redirect(toMessage("/register", "message", "Cek email Anda untuk verifikasi akun sebelum login."));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
