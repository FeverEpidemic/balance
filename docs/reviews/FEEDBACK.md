This report is provided as-is, no guarantees of accuracy are provided, I am not a security expert. I disclaim all responsibility for damages leading from this report.

--

I'll inspect the cloned app with a security-review lens: auth boundaries, Supabase usage/RLS assumptions, server actions, API routes, and places where financial data could leak or be overexposed. First I’ll map the repo and read the key security-relevant files in parallel.

I'll also check the repo guidance and remembered project notes before judging the code, so the review lines up with the app's own conventions.

Read [](file:///workspaces/ilham/balance)

Read memory

Read [](file:///workspaces/ilham/balance/AGENTS.md)

Read [](file:///workspaces/ilham/balance/package.json)

I’ve got the repo rules: this app relies heavily on Supabase RLS, server-only secret handling, and wallet membership checks. Next I’m going to locate all auth/data boundaries and then deep-read the highest-risk paths.

Search complete: Map security surfaces

The quick search agent didn’t return results, so I’ll do the mapping directly with `rg` and targeted reads. I’ll keep this as a review, not a code-change pass, unless you ask me to patch findings afterward.

Created 5 todos

I’m going to run broad code searches for admin clients, auth checks, route handlers, exports, and cache keys; that should reveal where the real review effort belongs.

Searched for regex `service_role|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|createAdmin|adminClient|createClient\(|createBrowserClient|createServerClient` (`**/*.{ts,tsx,mjs,js,sql,json,md}`), 113 results

Searched for regex `requireUser|requireAuth|auth\.getUser|getSession|user\.id|wallet_id|walletId|owner_id|member|memberships|RLS|policy` (`**/*.{ts,tsx,mjs,js,sql}`), 200 results

Searched for regex `route\.ts|export async function (GET|POST|PUT|DELETE|PATCH)|NextRequest|NextResponse|cookies\(|headers\(|redirect\(` (`**/app/**`), 121 results

Searched for regex `OpenAI|openai|chat|pdf|report|xlsx|export|download|apiKey|API key|token|invite|invitation|rateLimit|redis|cache` (`**/*.{ts,tsx,mjs,js,sql,json,md}`), 200 results

The first pass shows the high-risk surfaces are exactly where expected: Supabase admin usage, API-key chat routes, AI routes, PDF export, server actions, Redis cache, service worker, and SQL RLS. I’m going to deep-read those files now and then rank concrete findings with file references.

Starting: *Inspect auth and clients* (2/5)

I’ll read the auth/client layer, public service worker, and API auth helpers together; these decide most of the trust boundaries.

Read [](file:///workspaces/ilham/balance/lib/env.ts)

Read [](file:///workspaces/ilham/balance/lib/supabase/server.ts)

Read [](file:///workspaces/ilham/balance/lib/auth.ts)

Read [](file:///workspaces/ilham/balance/middleware.ts)

Read [](file:///workspaces/ilham/balance/lib/chat-auth.ts)

Read [](file:///workspaces/ilham/balance/lib/supabase/admin.ts)

Read [](file:///workspaces/ilham/balance/lib/supabase/browser.ts)

Read [](file:///workspaces/ilham/balance/public/sw.js)

Auth plumbing looks mostly disciplined: server/admin client separation is explicit, API keys are hashed, and the service worker only caches static assets/offline shell. I’m moving into route handlers and AI flows now, where privacy leakage is more likely.

Read [](file:///workspaces/ilham/balance/app/api/chat/rekap/route.ts)

Read [](file:///workspaces/ilham/balance/app/api/chat/transaction/route.ts)

Read [](file:///workspaces/ilham/balance/app/api/ai/chat/route.ts)

Read [](file:///workspaces/ilham/balance/app/api/ai/insight/route.ts)

Read [](file:///workspaces/ilham/balance/app/api/reports/%5BwalletId%5D/pdf/route.ts)

Read [](file:///workspaces/ilham/balance/lib/rate-limit.ts)

Read [](file:///workspaces/ilham/balance/lib/redis.ts#1-1), lines 1 to 260

Read [](file:///workspaces/ilham/balance/lib/chat-session.ts)

The API-key routes correctly verify membership before using the admin client, but they also return raw Supabase error text in a couple of failure paths. The bigger privacy surface is the AI/chat side: financial context is sent to an external model, and chat history is persisted in browser localStorage.

Next I’m checking the data-loader and cache layer, because finance apps often leak through broad cache keys or read helpers that trust caller-controlled wallet ids.

Read [](file:///workspaces/ilham/balance/lib/redis.ts#260-260), lines 260 to 333

Read [](file:///workspaces/ilham/balance/lib/data/cache.ts)

Read [](file:///workspaces/ilham/balance/lib/data/queries.ts)

Read [](file:///workspaces/ilham/balance/lib/data/index.ts#1-1), lines 1 to 360

Read [](file:///workspaces/ilham/balance/lib/ai/data.ts#1-1), lines 1 to 520

Read [](file:///workspaces/ilham/balance/lib/ai/client.ts)

Read [](file:///workspaces/ilham/balance/lib/ai/tools.ts)

Read [](file:///workspaces/ilham/balance/lib/ai/prompts.ts)

The read/cache keys include both wallet id and user id for wallet data, which is the right shape. I’m going to check write paths and RLS next; those determine whether forged form fields or direct Supabase requests can cross wallet boundaries.

Starting: *Inspect data mutations* (3/5)

I’ll read the main server actions for transactions, wallets/invites, API keys, budgets/savings/recurring; I’m looking for missing membership checks, role checks, and raw errors sent back to users.

Read [](file:///workspaces/ilham/balance/app/actions/_shared.ts)

Read [](file:///workspaces/ilham/balance/app/actions/api-keys.ts)

Read [](file:///workspaces/ilham/balance/app/actions/wallets.ts)

Read [](file:///workspaces/ilham/balance/app/actions/transactions.ts)

Read [](file:///workspaces/ilham/balance/app/actions/budgets.ts)

Read [](file:///workspaces/ilham/balance/app/actions/savings.ts)

Read [](file:///workspaces/ilham/balance/app/actions/recurring-transactions.ts)

Read [](file:///workspaces/ilham/balance/app/actions/settlements.ts)

Write actions largely rely on RLS instead of duplicating every membership check in TypeScript. That can be acceptable, but I’m seeing repeated raw database errors being reflected back to users; I’ll confirm whether SQL policies/triggers cover the authorization cases before calling that out.

Read [](file:///workspaces/ilham/balance/supabase/migrations)

I’ll read the SQL policies and security-definer functions next, especially any owner/editor/viewer distinctions and API-key table policies.

Read [](file:///workspaces/ilham/balance/supabase/migrations/0001_balance_mvp.sql)

Read [](file:///workspaces/ilham/balance/supabase/migrations/0003_fix_wallet_rls_recursion.sql)

Read [](file:///workspaces/ilham/balance/supabase/migrations/0004_wallet_invites_token_only.sql)

Read [](file:///workspaces/ilham/balance/supabase/migrations/0005_wallet_member_capacity.sql)

Read [](file:///workspaces/ilham/balance/supabase/migrations/0006_recurring_transactions.sql)

Read [](file:///workspaces/ilham/balance/supabase/migrations/0007_savings.sql)

Read [](file:///workspaces/ilham/balance/supabase/migrations/0010_transaction_balance_adjustments.sql)

Read [](file:///workspaces/ilham/balance/supabase/migrations/0011_user_api_keys.sql)

I found one concrete SQL issue worth escalating: a public security-definer RPC can create/update balance-adjustment categories for any wallet id without checking the caller’s membership. I’m checking whether API key hashes or other sensitive server-side fields are also flowing into the browser.

Searched for regex `key_hash|rawKey|secret|Authorization|localStorage|CHAT_STORAGE_KEY|balance-ai-chat|compute_wallet_available_balance|ensure_balance_adjustment_category` (`**/*.{ts,tsx,sql,mjs,js,json,md}`), 127 results

Read [](file:///workspaces/ilham/balance/lib/data/index.ts#320-320), lines 320 to 445

Read [](file:///workspaces/ilham/balance/lib/data/mappers.ts#1-1), lines 1 to 520

Read [](file:///workspaces/ilham/balance/lib/data/types.ts#1-1), lines 1 to 360

Read [](file:///workspaces/ilham/balance/components/features/chat/chat-page-content.tsx)

The settings loader strips API key hashes before returning data to the UI, so the `key_hash` select is unnecessary but not currently rendered. I’ll quickly locate the actual settings component and then finish with a ranked issue list.

Searched for files matching `**/*api*key*settings*.tsx`, no matches

I didn’t find that exact component name; I’ll search the settings folder and API key display code by symbol instead.

Searched for files matching `**/components/features/settings/**/*.tsx`, 1 match

Searched for regex `apiKeys|keyPrefix|createApiKey|revokeApiKey|deleteApiKey|rawKey|successResult` (`**/*.{ts,tsx}`), 83 results

Searched for regex `dangerouslySetInnerHTML|innerHTML|eval\(|new Function|JSON\.parse|request\.json\(|error\.message|console\.(log|error|warn)|localStorage|sessionStorage` (`**/*.{ts,tsx,js,mjs}`), 63 results

There’s another important client-side surface: chat messages are rendered as HTML. I’ll inspect the markdown renderer now to see whether assistant/user content is escaped before insertion.

Searched for regex `function renderMarkdown|renderMarkdown\(|markdown|escapeHtml|sanitize|DOMPurify` (`**/*.{ts,tsx}`), 39 results

Read [](file:///workspaces/ilham/balance/components/features/chat/chat-message.tsx)

Read [](file:///workspaces/ilham/balance/components/features/settings/settings-page-content.tsx)

Read [](file:///workspaces/ilham/balance/app/layout.tsx)

Read [](file:///workspaces/ilham/balance/lib/theme.ts)

Read [](file:///workspaces/ilham/balance/components/invitation-share-actions.tsx)

The chat HTML renderer does escape `<`, `>`, and `&` before inserting its tiny markdown subset, so I’m not treating that as an XSS finding. I’ll validate auth redirect handling and then pull exact line numbers for the findings.

Read [](file:///workspaces/ilham/balance/lib/auth-flow.ts)

Read [](file:///workspaces/ilham/balance/app/actions/auth.ts)

Read [](file:///workspaces/ilham/balance/app/auth/callback/route.ts)

Read [](file:///workspaces/ilham/balance/app/auth/confirm/route.ts)

Read [](file:///workspaces/ilham/balance/.env.example)

Read [](file:///workspaces/ilham/balance/Dockerfile)

Read [](file:///workspaces/ilham/balance/docker-compose.yml)

Read [](file:///workspaces/ilham/balance/next.config.ts)

One auth concern is forming signup confirmation URLs from the request `Origin` header. I’m also checking invitations now because token links are bearer credentials and should not be exposed to non-owners.

Searched for regex `invitations|Invitation|inviteUrl|token|currentUserRole|role === "owner"|role !== "owner"` (`**/app/[[]locale[]]/(app)/wallets/** components/features/wallets/** components/invitation-share-actions.tsx`), no results

Searched for files matching `**/app/[locale]/(app)/wallets/**/members/page.tsx`, no matches

Searched for files matching `**/components/features/wallets/**/*.tsx`, 2 matches

Read [](file:///workspaces/ilham/balance/app/%5Blocale%5D/invite/%5Btoken%5D/page.tsx)

Read [](file:///workspaces/ilham/balance/components/wallet-tabs.tsx)

The public invite page uses the token as the bearer secret, which is expected. I need the wallet members page path next; the search glob was too fussy, so I’ll list the wallet route tree.

Read [](file:///workspaces/ilham/balance/app/%5Blocale%5D/%28app%29/wallets)

I’ll list the nested wallet pages and read the members page/component to see whether invite tokens are available to viewers.

Read [](file:///workspaces/ilham/balance/app/%5Blocale%5D/%28app%29/wallets/%5BwalletId%5D)

Read [](file:///workspaces/ilham/balance/components/features/wallets/wallet-overview-content.tsx)

Read [](file:///workspaces/ilham/balance/components/features/wallets/wallets-page-content.tsx)

I’ll open the members route directly; that’s where invite tokens would be surfaced if the app passes them to the client.

Read [](file:///workspaces/ilham/balance/app/%5Blocale%5D/%28app%29/wallets/%5BwalletId%5D/members/page.tsx)

A second concrete RLS issue surfaced: pending invitation tokens are protected only by “is any wallet member,” while the UI treats them as owner-only. I’m checking the AI data payload details now so the privacy finding is precise.

Searched for regex `privacy|DeepSeek|AI|third-party|third party|OpenAI|chat|localStorage|history` (`**/messages/*.json app/[[]locale[]]/privacy/page.tsx README.md docs/**/*.md`), no results

Read [](file:///workspaces/ilham/balance/lib/ai/data.ts#360-360), lines 360 to 620

Read [](file:///workspaces/ilham/balance/supabase/migrations/0008_saving_entry_transactions.sql#1-1), lines 1 to 220

Read [](file:///workspaces/ilham/balance/docs/API_REFERENCE.md#1-1), lines 1 to 220

Read [](file:///workspaces/ilham/balance/app/%5Blocale%5D/privacy/page.tsx)

The AI payload includes wallet names, aggregate financials, category names, and up to three recent transaction notes for a matched category, plus tool access to recent transactions. That’s useful functionality, but it needs explicit privacy treatment because it leaves the app boundary when the external model is enabled.

Searched for regex `privacy|thirdParty|DeepSeek|AI|chat|localStorage|history` (`**/messages/en.json`), 120 results

Searched for regex `privacy|thirdParty|DeepSeek|AI|chat|localStorage|history` (`**/messages/id.json`), 120 results

Searched for regex `wallet_invitations_select_wallet_members|wallet_members_insert_owner|ensure_balance_adjustment_category|compute_wallet_available_balance|settlements_mutate_editors|transactions_mutate_editors|budgets_mutate_editors` (`**/supabase/migrations/*.sql`), 27 results

Searched for regex `error\.message|txError\.message|insertError\?\.message|existingError\?\.message|acceptError\?\.message` (`**/app/**/*.{ts,tsx} lib/**/*.ts`), no results

I’m going to read the auth-sync migration because it also touches wallet-member insertion; that will tell me whether direct member-add bypass was intentional or left too broad.

Read [](file:///workspaces/ilham/balance/supabase/migrations/0002_balance_auth_sync.sql)

One more important issue: the browser/manual and AI-tool transaction paths enforce the free-tier monthly transaction limit, but the external API-key transaction route does not. I’ll inspect the limit helper to make sure that assessment is accurate.

Searched for regex `checkFreeTransactionLimit|incrementTransactionCount|consumeTransactionRateLimit` (`**/*.{ts,tsx}`), 26 results

Read [](file:///workspaces/ilham/balance/lib/transaction-limits.ts)

Read [](file:///workspaces/ilham/balance/supabase/migrations/0015_user_plan_tier.sql)

I have enough for the main findings. I’ll do one last quick dependency/use check around Excel/PDF exports and then I’ll summarize with severity and fix direction.

Searched for regex `xlsx|XLSX|read\(|writeFile|utils\.json_to_sheet|renderToBuffer|Content-Disposition|Cache-Control` (`**/*.{ts,tsx}`), 17 results

Read [](file:///workspaces/ilham/balance/lib/pdf/index.ts)

Read [](file:///workspaces/ilham/balance/components/features/transactions/export-excel-button.tsx)

Read [](file:///workspaces/ilham/balance/components/features/reports/export-pdf-button.tsx)

Read [](file:///workspaces/ilham/balance/lib/utils.ts)

Export review added one practical data-handling issue: user-controlled transaction/category text is written straight into spreadsheets, which can become formula injection in Excel-style clients. I’m pulling final line references now.

Searched for regex `"thirdParty"|"cookies"|"dataStorage"|"howWeUse"|"dataWeCollect"` (`**/messages/en.json`), 6 results

Searched for regex `json_to_sheet|window\.localStorage\.setItem|window\.localStorage\.getItem|buildAiSystemPrompt|getAiClient|new OpenAI|createAdminClient|SUPABASE_SECRET_KEY|Origin|headers\(\)` (`**/*.{ts,tsx}`), 78 results

Searched for regex `create policy "wallet_invitations_select_wallet_members"|create policy "wallet_members_insert_owner"|grant execute on function public.ensure_balance_adjustment_category|create or replace function public.ensure_balance_adjustment_category|create policy "settlements_mutate_editors"|create policy "transactions_mutate_editors"` (`**/supabase/migrations/*.sql`), 13 results

I’ve finished the review pass and am organizing the findings by severity now. I didn’t make code changes, so there’s nothing to run beyond the static inspection.

Starting: *Summarize ranked findings* (5/5)

I’ll grab one precise line for the invitation query so the final review points exactly at both the policy and the selected token field.

Searched for regex `export async function queryInvitations|select\("id, wallet_id, role, token, status, invited_by, expires_at, created_at"` (`**/lib/data/queries.ts`), 2 results

I’ve got the exact references. Finishing the ranked review now.

Completed: *Summarize ranked findings* (5/5)

**Findings**

**High: public security-definer RPC bypasses wallet authorization.**  
supabase/migrations/0010_transaction_balance_adjustments.sql defines `public.ensure_balance_adjustment_category` as `security definer`, inserts/upserts categories for any `target_wallet_id`, accepts a caller-provided `actor_user_id`, and has no `auth.uid()` / membership / editor-role check. It is then granted to all authenticated users at supabase/migrations/0010_transaction_balance_adjustments.sql. Any signed-in user can call this public RPC through Supabase and mutate category data for a wallet id they should not control. Fix by checking `private.has_wallet_role(target_wallet_id, array['owner','editor'])`, deriving actor from `auth.uid()`, or revoking authenticated access and routing it through a server-only/service-role path.

**High: API-key transaction writes bypass the free-tier transaction limit.**  
The browser/manual transaction path checks `checkFreeTransactionLimit`, consumes transaction rate limit, and increments the monthly counter at app/actions/transactions.ts. The external API-key route only consumes the chat API limiter at app/api/chat/transaction/route.ts, then inserts with the admin client at app/api/chat/transaction/route.ts. It does not call `checkFreeTransactionLimit`, `consumeTransactionRateLimit`, or `incrementTransactionCount`. A user API key can therefore create transactions outside the plan controls. Best fix: route all transaction creation through one shared server helper that enforces membership, role, category validation, free-tier limit, rate limit, insert, count increment, and cache invalidation.

**High/Medium: invite tokens are readable by any wallet member through RLS.**  
The current invite policy allows any wallet member to select invitation rows at supabase/migrations/0004_wallet_invites_token_only.sql, and the query includes the bearer `token` field at lib/data/queries.ts. The UI only renders share actions for owners, but RLS is the actual boundary: a viewer/editor with a normal Supabase session can query pending invitation tokens directly and share/consume them. Fix by making token-bearing invitation reads owner-only, or split the model so non-owners can see counts/status without token values.

**Medium: owners can bypass the invitation flow and insert arbitrary wallet members.**  
The wallet-member insert policy lets any owner insert rows into `wallet_members` at supabase/migrations/0003_fix_wallet_rls_recursion.sql. That means an owner who knows another user id can add them directly, including elevated roles, without invite acceptance. If token-based consent is the intended model, restrict direct inserts to the wallet creator adding themselves as owner, and move all later membership changes into service-role RPCs with explicit checks.

**Medium: signup confirmation URL trusts the request `Origin`.**  
app/actions/auth.ts builds `emailRedirectTo` from `headers().get("origin")`. If Supabase redirect allow-listing is broad or misconfigured, a forged request could make confirmation links point at an attacker-controlled origin and expose confirmation material. Use configured `getSiteUrl()` as canonical, or validate `Origin` against an explicit allow-list before using it.

**Medium: AI data sharing and local retention need stronger privacy controls.**  
AI chat uses an external OpenAI-compatible client at lib/ai/client.ts, sends recap context from app/api/ai/chat/route.ts, and the prompt can include wallet names, category totals, and recent transaction notes from lib/ai/prompts.ts and lib/ai/data.ts. The privacy copy currently frames third parties around Supabase only at messages/en.json. Chat history is also persisted in browser `localStorage` at components/features/chat/chat-page-content.tsx under the key defined in lib/chat-session.ts. For a finance app, I’d make AI opt-in, document provider/data categories/retention, minimize or redact notes by default, and consider session-only storage or a clear retention toggle.

**Medium: spreadsheet formula injection in Excel export.**  
components/features/transactions/export-excel-button.tsx writes user-controlled transaction titles/category names directly into XLSX cells. Notes/categories beginning with `=`, `+`, `-`, `@`, tab, or CR can be interpreted as formulas by spreadsheet software, which can lead to external calls or data exfiltration when a user opens the file. Sanitize exported strings by prefixing dangerous leading characters with `'` or otherwise forcing text cells.

**Low/Medium: raw database errors are reflected to users/API callers.**  
Several actions return `error.message` directly, for example app/actions/budgets.ts, app/actions/settlements.ts, and app/api/chat/rekap/route.ts. This can leak policy names, constraint names, function exception text, and schema details. Map expected database errors to localized safe messages and keep raw details in server logs only.

**Good Signs**

I did not see server-only Supabase secret keys being exposed to client code. The admin client is in a `server-only` module, the service worker only caches static/offline assets rather than financial pages, PDF export sets `Cache-Control: private, no-store`, and the chat markdown renderer escapes HTML before using `dangerouslySetInnerHTML`.

I didn’t make code changes in this pass. The highest-value patch order is: lock down the public RPC, fix API transaction limit enforcement, tighten invitation/member RLS, then address AI/privacy and export sanitization.