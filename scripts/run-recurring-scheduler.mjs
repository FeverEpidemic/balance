import webPush from "web-push";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const intervalMs = Number(process.env.RECURRING_SCHEDULER_INTERVAL_MS || "60000");
const batchSize = Number(process.env.RECURRING_SCHEDULER_BATCH_SIZE || "50");
const supabaseUrl = (process.env.SCHEDULER_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serverKey) {
  console.error("[recurring-scheduler] Missing Supabase URL or server key.");
  process.exit(1);
}

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@mybalance.my.id";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.warn("[recurring-scheduler] VAPID keys not configured. Web Push reminders will be skipped.");
}

async function processBatch() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/process_due_recurring_transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serverKey,
      Authorization: `Bearer ${serverKey}`
    },
    body: JSON.stringify({
      run_until: new Date().toISOString(),
      batch_size: batchSize
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RPC failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  console.log(
    `[recurring-scheduler] processed=${data.processed ?? 0} generated=${data.generated ?? 0} skipped=${data.skipped ?? 0} run_until=${data.run_until ?? "-"}`
  );
}

async function processExpiredSubscriptions() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/process_expired_subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serverKey,
      Authorization: `Bearer ${serverKey}`
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`process_expired_subscriptions RPC failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const count = data?.processed_count ?? 0;
  if (count > 0) {
    console.log(`[recurring-scheduler] expired subscriptions processed: ${count} user(s) downgraded`);
  }
}

async function processDueReminders() {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_due_push_reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serverKey,
        Authorization: `Bearer ${serverKey}`
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`get_due_push_reminders RPC failed (${response.status}): ${body}`);
    }

    const subscriptions = await response.json();
    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return;
    }

    console.log(`[recurring-scheduler] Found ${subscriptions.length} due reminders.`);

    const successfulUserIds = [];
    const successfulLocalDates = [];

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      const payload = JSON.stringify({
        title: "Pengingat Catat Keuangan 📝",
        body: "Jangan lupa catat pengeluaran dan pemasukan Anda hari ini di Balance!",
        url: "/dashboard"
      });

      try {
        await webPush.sendNotification(pushSubscription, payload);
        successfulUserIds.push(sub.user_id);
        successfulLocalDates.push(sub.local_date);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`[recurring-scheduler] Sub invalid (${error.statusCode}). Deleting subscription for endpoint: ${sub.endpoint}`);
          try {
            await fetch(`${supabaseUrl}/rest/v1/rpc/delete_push_subscription_by_endpoint`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: serverKey,
                Authorization: `Bearer ${serverKey}`
              },
              body: JSON.stringify({ endpoint_url: sub.endpoint })
            });
          } catch (delError) {
            console.error(`[recurring-scheduler] Failed to delete invalid sub:`, delError);
          }
        } else {
          console.error(`[recurring-scheduler] Failed to send push to user ${sub.user_id}:`, error);
        }
      }
    }

    if (successfulUserIds.length > 0) {
      const markResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/mark_reminders_sent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serverKey,
          Authorization: `Bearer ${serverKey}`
        },
        body: JSON.stringify({
          user_ids: successfulUserIds,
          local_dates: successfulLocalDates
        })
      });

      if (!markResponse.ok) {
        const body = await markResponse.text();
        console.error(`[recurring-scheduler] mark_reminders_sent RPC failed (${markResponse.status}): ${body}`);
      } else {
        console.log(`[recurring-scheduler] Marked ${successfulUserIds.length} reminders as sent.`);
      }
    }
  } catch (error) {
    console.error("[recurring-scheduler] reminder cycle failed", error);
  }
}

async function main() {
  console.log(`[recurring-scheduler] started interval=${intervalMs}ms batch=${batchSize}`);

  while (true) {
    try {
      await processBatch();
    } catch (error) {
      console.error("[recurring-scheduler] recurring cycle failed", error);
    }

    try {
      await processExpiredSubscriptions();
    } catch (error) {
      console.error("[recurring-scheduler] expiry cycle failed", error);
    }

    try {
      await processDueReminders();
    } catch (error) {
      console.error("[recurring-scheduler] reminders cycle failed", error);
    }

    await sleep(intervalMs);
  }
}

main().catch((error) => {
  console.error("[recurring-scheduler] fatal", error);
  process.exit(1);
});
