const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const intervalMs = Number(process.env.RECURRING_SCHEDULER_INTERVAL_MS || "60000");
const batchSize = Number(process.env.RECURRING_SCHEDULER_BATCH_SIZE || "50");
const supabaseUrl = (process.env.SCHEDULER_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serverKey) {
  console.error("[recurring-scheduler] Missing Supabase URL or server key.");
  process.exit(1);
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

    await sleep(intervalMs);
  }
}

main().catch((error) => {
  console.error("[recurring-scheduler] fatal", error);
  process.exit(1);
});
