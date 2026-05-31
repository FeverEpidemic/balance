"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath, withAuthMessage } from "@/lib/auth-flow";
import { ensureProfileForUser } from "@/lib/profile";
import { getSiteUrl } from "@/lib/env";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeRedirectPath(String(formData.get("next") ?? "/dashboard"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(withAuthMessage("/login", "error", error.message, next));
  }

  if (data.user) {
    await ensureProfileForUser(data.user);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeRedirectPath(
    String(formData.get("next") ?? "/wallets?message=Akun aktif. Buat wallet pertama Anda."),
    "/wallets?message=Akun aktif. Buat wallet pertama Anda."
  );
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? getSiteUrl();
  const confirmUrl = new URL("/auth/confirm", origin);
  confirmUrl.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: confirmUrl.toString()
    }
  });

  if (error) {
    redirect(withAuthMessage("/register", "error", error.message, next, "/wallets?message=Akun aktif. Buat wallet pertama Anda."));
  }

  if (data.user) {
    await ensureProfileForUser(data.user);
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  redirect(
    withAuthMessage(
      "/register",
      "message",
      "Cek email Anda untuk verifikasi akun sebelum login.",
      next,
      "/wallets?message=Akun aktif. Buat wallet pertama Anda."
    )
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
