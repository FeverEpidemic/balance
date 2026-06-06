"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { invalidateDashboardCache } from "@/lib/data/cache";

async function updateOnboardingState(state: "dismissed" | "completed") {
  const { supabase, user } = await requireUser();
  const now = new Date().toISOString();
  const payload =
    state === "dismissed"
      ? {
          onboarding_state: "dismissed",
          onboarding_dismissed_at: now
        }
      : {
          onboarding_state: "completed",
          onboarding_completed_at: now
        };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

  if (error) {
    throw error;
  }

  await invalidateDashboardCache([user.id]);
  revalidatePath("/dashboard");
}

export async function dismissOnboarding() {
  await updateOnboardingState("dismissed");
}

export async function completeOnboarding() {
  await updateOnboardingState("completed");
}
