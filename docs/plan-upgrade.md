# Plan Upgrade / Downgrade

Admin runbook for upgrading or downgrading a user's plan.

## Free Trial 7 Hari

Every new profile automatically gets a 7-day Premium trial.

### Inspect trial status

```sql
SELECT id, plan_type, trial_started_at, trial_ends_at, trial_consumed_at
FROM profiles
WHERE id = '<user-id>';
```

### Manually extend or override a trial

```sql
UPDATE profiles
SET trial_ends_at = timezone('utc', now()) + interval '7 days'
WHERE id = '<user-id>';
```

> **Note:** `plan_type = 'premium'` always beats trial expiration. If a user has `plan_type = 'premium'`, they are treated as premium regardless of trial dates.

## SQL (Direct via Supabase SQL Editor or psql)

### Upgrade user to Premium

```sql
UPDATE profiles
SET plan_type = 'premium'
WHERE id = '<user-id>';
```

### Downgrade user to Free

```sql
UPDATE profiles
SET plan_type = 'free'
WHERE id = '<user-id>';
```

## Important Notes

- Plan changes affect the AI Chat daily limit. Free users get the env-configured limit (`AI_CHAT_DAILY_LIMIT_MAX`, default 5 messages/day). Premium users have no daily limit.
- Premium is normally bought through Midtrans (`createSubscription` in `app/actions/subscriptions.ts`, confirmed by `POST /api/midtrans/notification`). The SQL above is the manual admin override.
- A manual upgrade has no row in `subscriptions`, so `process_expired_subscriptions()` never downgrades it. Downgrade it by hand when it should end.
- API Key & AI integration via API endpoints is **always free** and not affected by plan changes.
- Manual transactions are **unlimited** for both Free and Premium plans.
