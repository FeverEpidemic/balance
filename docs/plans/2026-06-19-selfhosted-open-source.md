# Self-Hosted Open Source Release — Implementation Plan

> **Executor options:**
> - **Hermes** — use `subagent-driven-development` skill to dispatch task-by-task
> - **Manual** — follow steps directly

**Goal:** Prepare the Balance codebase for public open-source release with a clean self-hosted mode that gracefully disables premium/SaaS features.

**Architecture:** Single codebase, dual mode via `SELF_HOSTED_MODE` env var. Self-hosted deployments get all features unlocked (they own their infra). The SaaS deployment at mybalance.my.id uses billing/subscription flags to gate premium features. No code forks, no separate repos.

**Tech Stack:** Next.js 16, TypeScript, Supabase, Docker Compose, Midtrans

---

## Task 1: Add LICENSE file (AGPL-3.0)

**Objective:** Provide a standard AGPL-3.0 license so users know their rights and obligations.

**Files:**
- Create: `LICENSE`

**Step 1:** Fetch the official AGPL-3.0 license text

```bash
curl -o /home/ilham827/balance-tmp/LICENSE https://www.gnu.org/licenses/agpl-3.0.txt
```

**Step 2:** Verify file exists

```bash
head -5 /home/ilham827/balance-tmp/LICENSE
```
Expected: Contains "GNU AFFERO GENERAL PUBLIC LICENSE"

---

## Task 2: Update package.json for open source

**Objective:** Remove `private: true`, add `license` and `repository` fields.

**Files:**
- Modify: `package.json`

**Changes:**

```json
{
  "name": "balance",
  "version": "0.1.0",
  "private": false,
  "license": "AGPL-3.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/FeverEpidemic/balance.git"
  },
```

Also add `homepage` and `bugs` fields:

```json
  "homepage": "https://mybalance.my.id",
  "bugs": {
    "url": "https://github.com/FeverEpidemic/balance/issues"
  },
```

**Verification:**
```bash
grep -E '"private"|"license"|"repository"|"homepage"' /home/ilham827/balance-tmp/package.json
```

---

## Task 3: Create CONTRIBUTING.md

**Objective:** Guide contributors on how to set up, code, and submit PRs.

**Files:**
- Create: `CONTRIBUTING.md`

**Content outline:**
1. Welcome + license (AGPL-3.0)
2. Development setup (clone, copy .env.example, npm install, npm run dev)
3. Code conventions (TypeScript strict, semicolons, double quotes, AI agent rules in AGENTS.md)
4. PR workflow (fork → branch → commit → PR)
5. Commit message format (conventional commits: feat/fix/docs/refactor/test)
6. Testing (npm run test, npm run typecheck before submitting)
7. Self-hosted vs SaaS — explain that `SELF_HOSTED_MODE=true` disables billing, all features available
8. Code of conduct — be respectful

---

## Task 4: Create SECURITY.md

**Objective:** Provide a clear channel for reporting vulnerabilities.

**Files:**
- Create: `SECURITY.md`

**Content:**
1. Do NOT open public issues for security vulnerabilities
2. Email contact or GitHub private vulnerability reporting link
3. Expected response time (e.g., 72 hours)
4. Supported versions (latest only)
5. Disclosure policy

---

## Task 5: Create feature flag system (`lib/features.ts`)

**Objective:** Centralize all feature gating logic so premium features can be unlocked or locked based on env + subscription status.

**Files:**
- Create: `lib/features.ts`

**Code:**

```typescript
// lib/features.ts
// Central feature flag system for Balance.
// Self-hosted deployments (SELF_HOSTED_MODE=true) unlock ALL features.
// SaaS deployments check subscription status via Midtrans/billing.

import { readBooleanEnv } from "@/lib/env";

export type FeatureFlag =
  | "ai_chat"
  | "shared_wallets"
  | "unlimited_recurring"
  | "advanced_reports"
  | "pdf_export"
  | "multi_currency"
  | "unlimited_transactions";

type FeatureSet = Record<FeatureFlag, boolean>;

/**
 * Returns true if running in self-hosted mode.
 * Self-hosted = all features unlocked, no billing checks.
 */
export function isSelfHosted(): boolean {
  return readBooleanEnv("SELF_HOSTED_MODE", false);
}

/**
 * Returns the base feature set available to free (non-subscribed) users.
 * When SELF_HOSTED_MODE=true, all features are free.
 * When SELF_HOSTED_MODE=false, only basic features are free.
 */
export function getFreeFeatures(): FeatureSet {
  if (isSelfHosted()) {
    return {
      ai_chat: true,
      shared_wallets: true,
      unlimited_recurring: true,
      advanced_reports: true,
      pdf_export: true,
      multi_currency: true,
      unlimited_transactions: true,
    };
  }

  return {
    ai_chat: false,        // Limited to daily quota via AI_CHAT_DAILY_LIMIT_MAX
    shared_wallets: false, // Single wallet only
    unlimited_recurring: false, // Max FREE_TIER_MAX_MONTHLY_TRANSACTIONS
    advanced_reports: false,
    pdf_export: false,
    multi_currency: false,
    unlimited_transactions: false, // Max FREE_TIER_MAX_MONTHLY_TRANSACTIONS
  };
}

/**
 * Returns the premium feature set for subscribed users.
 * On SaaS, this is what paying subscribers get.
 */
export function getPremiumFeatures(): FeatureSet {
  if (isSelfHosted()) {
    return getFreeFeatures(); // Self-hosted = everything unlocked
  }

  return {
    ai_chat: true,
    shared_wallets: true,
    unlimited_recurring: true,
    advanced_reports: true,
    pdf_export: true,
    multi_currency: true,
    unlimited_transactions: true,
  };
}

/**
 * Check if a specific feature is available.
 * @param plan - User's current plan ('free' | 'premium')
 * @param feature - The feature to check
 */
export function isFeatureAvailable(plan: "free" | "premium", feature: FeatureFlag): boolean {
  if (isSelfHosted()) return true;

  if (plan === "premium") {
    return getPremiumFeatures()[feature];
  }

  return getFreeFeatures()[feature];
}
```

Note: `readBooleanEnv` is already defined in `lib/env.ts`. We need to export it:

```typescript
// In lib/env.ts, change readBooleanEnv from function to exported:
export function readBooleanEnv(name: string, defaultValue: boolean): boolean {
```

---

## Task 6: Export `readBooleanEnv` from `lib/env.ts`

**Objective:** Make `readBooleanEnv` accessible from `lib/features.ts`.

**Files:**
- Modify: `lib/env.ts:59`

**Change:** `function readBooleanEnv` → `export function readBooleanEnv`

Also add `SELF_HOSTED_MODE` to `.env.example`:

```env
# Set to true for self-hosted deployments (unlocks all features, disables billing)
SELF_HOSTED_MODE=false
```

---

## Task 7: Gate AI Chat behind feature flag

**Objective:** Disable AI Chat when feature not available for the user's plan.

**Files:**
- Identify: Check where AI Chat daily limit is enforced
- Likely: `lib/ai/` or the chat route handler

**Approach:** Add a check in the AI Chat route handler:

```typescript
import { isFeatureAvailable } from "@/lib/features";

// Before processing AI chat request:
if (!isFeatureAvailable(userPlan, "ai_chat")) {
  return new Response(JSON.stringify({ error: "AI Chat tidak tersedia untuk paket Anda" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
```

Need to examine the actual AI Chat code to find the right injection point.

---

## Task 8: Gate shared wallet creation

**Objective:** Prevent free-tier users from creating shared wallets on SaaS.

**Files:**
- Identify: Wallet creation server action (likely `app/actions/wallet.ts` or similar)

**Approach:** Before creating a wallet with `kind = 'shared'`, check feature flag.

---

## Task 9: Update README.md with open source badges

**Objective:** Make the README look professional and welcoming for open source.

**Files:**
- Modify: `README.md`

**Add top of README:**
```markdown
<p align="center">
  <img src="public/logo-balance-wordmark.svg" alt="Balance" width="200"/>
</p>

<p align="center">
  <strong>Personal & household finance tracker — in Bahasa Indonesia</strong>
</p>

<p align="center">
  <a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL v3"/></a>
  <a href="https://github.com/FeverEpidemic/balance/stargazers"><img src="https://img.shields.io/github/stars/FeverEpidemic/balance" alt="GitHub stars"/></a>
  <a href="https://github.com/FeverEpidemic/balance/actions"><img src="https://img.shields.io/github/actions/workflow/status/FeverEpidemic/balance/ci.yml" alt="CI"/></a>
  <a href="https://mybalance.my.id"><img src="https://img.shields.io/badge/demo-mybalance.my.id-brightgreen" alt="Demo"/></a>
</p>

**Balance** is a mobile-responsive Next.js MVP for household finance in Bahasa Indonesia...
```

Also add a "Self-Hosted" section after the intro:

```markdown
## 🏠 Self-Hosted

Balance is fully self-hostable. You can run your own instance with Docker Compose:

```bash
git clone https://github.com/FeverEpidemic/balance.git
cd balance
cp .env.example .env
# Edit .env — set SUPABASE credentials, etc.
# Set SELF_HOSTED_MODE=true to unlock all features
docker compose up --build -d
```

See the [Docker Setup](#run-locally) section below for detailed instructions.

---

## [Hosted Version](https://mybalance.my.id)

Don't want to manage infrastructure? Use the hosted SaaS version at [mybalance.my.id](https://mybalance.my.id) — no setup required.
```

---

## Task 10: Simplify docker-compose.yml for self-hosted

**Objective:** Make the default `docker-compose.yml` work without Midtrans/billing dependencies.

**Files:**
- Modify: `docker-compose.yml`

**Changes:** Add `SELF_HOSTED_MODE=true` as a default env to the `app` and `scheduler` services.

```yaml
    environment:
      NODE_ENV: production
      SELF_HOSTED_MODE: true
      HOSTNAME: 0.0.0.0
      PORT: 3000
      NEXT_TELEMETRY_DISABLED: 1
```

This ensures `docker compose up` gives a fully working self-hosted instance out of the box.

---

## Task 11: Final verification

**Objective:** Confirm everything compiles and tests pass.

**Steps:**
1. `npm run typecheck` — no type errors
2. `npm run test:unit` — all tests pass
3. `npm run build` — production build succeeds (if environment allows)
4. Verify `LICENSE` file is valid text
5. Verify CONTRIBUTING.md renders properly
6. Verify `lib/features.ts` imports correctly

---

## Summary of Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `LICENSE` | **Create** | AGPL-3.0 license text |
| `CONTRIBUTING.md` | **Create** | Contributor guide |
| `SECURITY.md` | **Create** | Vulnerability reporting |
| `lib/features.ts` | **Create** | Central feature flag system |
| `lib/env.ts:59` | **Modify** | Export `readBooleanEnv` |
| `.env.example` | **Modify** | Add `SELF_HOSTED_MODE` |
| `package.json` | **Modify** | Remove private, add license/repo/homepage/bugs |
| `README.md` | **Modify** | Add badges, self-host section, open source info |
| `docker-compose.yml` | **Modify** | Add `SELF_HOSTED_MODE=true` default |

**Estimated effort:** ~2 hours of focused work.
