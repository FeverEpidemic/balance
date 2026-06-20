"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { invalidateSettingsCache, invalidateShellDataCache } from "@/lib/data/cache";
import { errorResult, getActionLocale, successResult, type ActionResult } from "@/app/actions/_shared";
import { localizePath, translate } from "@/lib/i18n";

/**
 * Save browser push notification subscription to the database.
 */
export async function savePushSubscriptionAction(
  endpoint: string,
  p256dh: string,
  auth: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const locale = await getActionLocale();

    if (!endpoint || !p256dh || !auth) {
      return errorResult(translate(locale, "actionErrors.unexpectedError"));
    }

    // Upsert subscription (if endpoint exists, it will update keys or just stay)
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        updated_at: new Date().toISOString()
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[reminders-action] savePushSubscription error:", error);
      return errorResult(translate(locale, "actionErrors.unexpectedError"));
    }

    return successResult("Subscription saved successfully");
  } catch (err) {
    console.error("[reminders-action] savePushSubscription fatal error:", err);
    return errorResult("Failed to save subscription");
  }
}

/**
 * Delete push notification subscription from the database.
 */
export async function deletePushSubscriptionAction(endpoint: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const locale = await getActionLocale();

    if (!endpoint) {
      return errorResult(translate(locale, "actionErrors.unexpectedError"));
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);

    if (error) {
      console.error("[reminders-action] deletePushSubscription error:", error);
      return errorResult(translate(locale, "actionErrors.unexpectedError"));
    }

    return successResult("Subscription deleted successfully");
  } catch (err) {
    console.error("[reminders-action] deletePushSubscription fatal error:", err);
    return errorResult("Failed to delete subscription");
  }
}

/**
 * Update daily reminder enabled flag and target time.
 */
export async function updateReminderPreferencesAction(
  enabled: boolean,
  time: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const locale = await getActionLocale();

    // Validate time format (HH:MM)
    if (enabled && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return errorResult("Format waktu tidak valid (harus HH:MM)");
    }

    // Format time to HH:MM:00 for postgres time column compatibility
    const formattedTime = enabled ? `${time}:00` : "20:00:00";

    const { error } = await supabase
      .from("profiles")
      .update({
        daily_reminder_enabled: enabled,
        daily_reminder_time: formattedTime
      })
      .eq("id", user.id);

    if (error) {
      console.error("[reminders-action] updateReminderPreferences error:", error);
      return errorResult(translate(locale, "actionErrors.unexpectedError"));
    }

    await invalidateSettingsCache(user.id);
    await invalidateShellDataCache(user.id);
    revalidatePath(localizePath(locale, "/settings"));
    revalidatePath("/", "layout");

    return successResult(
      enabled
        ? `Pengingat berhasil diaktifkan pada pukul ${time}`
        : "Pengingat berhasil dinonaktifkan"
    );
  } catch (err) {
    console.error("[reminders-action] updateReminderPreferences fatal error:", err);
    return errorResult("Gagal memperbarui preferensi pengingat");
  }
}
