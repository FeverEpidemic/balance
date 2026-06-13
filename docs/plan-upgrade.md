# Plan Upgrade / Downgrade

Admin runbook for upgrading or downgrading a user's plan.

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

- Plan changes affect the AI Chat daily limit. Free users get the env-configured limit (default 20 messages/day). Premium users have no daily limit.
- There is **no payment integration** in this phase. Premium is assigned manually by the admin.
- API Key & AI integration via API endpoints is **always free** and not affected by plan changes.
- Manual transactions are **unlimited** for both Free and Premium plans.
