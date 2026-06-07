# Full i18n Upgrade Plan for `balance`

## Summary
- Treat the current partial `id/en` locale foundation as the baseline and finish the migration instead of redesigning i18n from scratch.
- The target is full user-facing i18n coverage for UI, metadata, navigational text, validation/toast messages, and page-specific content across public and authenticated surfaces.
- Keep `id` as the source-of-truth fallback locale and `en` as the complete secondary locale.
- Finish the upgrade by standardizing how translation lookup, locale formatting, and locale-aware routing are used so no page depends on mixed hardcoded strings and ad hoc `locale === "en"` branches.

## Key Changes
- Consolidate i18n architecture around the existing `lib/i18n.ts` + `messages/{id,en}.json` approach.
  - Use message keys as the only source for user-facing copy.
  - Remove direct inline translation branching from components and pages.
  - Expand dictionaries by feature area so all strings are grouped predictably: `common`, `auth`, `landing`, `dashboard`, `wallets`, `transactions`, `budgets`, `savings`, `recurring`, `reports`, `members`, `settlements`, `templates`, `settings`, `offline`, `invite`, `errors`.
- Finish locale-aware page migration.
  - Migrate all remaining hardcoded strings in `app/[locale]/**` and feature components under `components/features/**` to message keys.
  - Ensure page metadata for each locale is generated from dictionaries, not inline literals.
  - Standardize empty states, loading copy, confirm dialogs, button labels, section headers, helper text, and toast messages through translation lookup.
- Standardize locale formatting and derived labels.
  - Replace all remaining hardcoded `id-ID` date/number formatting and locale-sensitive labels in `lib/data/mappers.ts`, page components, and utility calls with locale-aware helpers.
  - Pass active locale into mapper or presentation-layer formatting where view models currently embed Indonesian labels.
  - Keep sorting/business rules stable unless locale-specific display is required; only localize rendered labels and formatted values.
- Close routing and redirect consistency gaps.
  - Audit all links, redirects, auth callbacks, invite flows, and revalidation targets to ensure they always preserve the active locale.
  - Ensure locale precedence remains URL > profile > cookie > browser > fallback and document this in the plan.
  - Keep `/auth/*` and `/api/*` behavior unchanged externally while preserving locale-aware return destinations.
- Complete settings and persistence behavior.
  - Keep `profiles.preferred_locale` and cookie mirroring as the persistence mechanism.
  - Ensure the language switcher updates account state, cookie state, redirect destinations, and any relevant revalidation paths consistently.
  - Define fallback behavior for missing message keys in development and production so incomplete translations are visible during implementation but safe at runtime.

## Important Interfaces / Types
- `messages/id.json` and `messages/en.json` become the required source for all user-facing copy.
- `lib/i18n.ts` remains the central API for:
  - locale validation and resolution
  - localized path generation
  - message lookup and interpolation
  - fallback behavior
- Locale-aware formatting helpers in `lib/utils.ts` become the only approved path for:
  - currency formatting
  - short date formatting
  - date-time formatting
- View-model producers that currently emit localized labels will need explicit locale input or must move localized labeling to the rendering layer.
- `profiles.preferred_locale` remains the persisted language preference; no additional schema changes are required unless implementation uncovers missing audit or constraint coverage.

## Test Plan
- Unit tests for `lib/i18n.ts`
  - locale parsing from pathname
  - localized path generation
  - precedence resolution
  - fallback to `id`
  - message interpolation and missing-key fallback
- Unit tests for locale formatting helpers
  - `id` vs `en` currency
  - `id` vs `en` date and datetime
  - unsupported locale fallback
- Unit tests for auth and redirect helpers
  - locale-preserving login/register/invite/auth-error flows
  - callback/confirm round trips preserving locale and `next`
- Mapper/rendering tests
  - any derived labels now localized through helpers or message keys
  - dashboard/report/history outputs render correctly in both locales
- Smoke coverage for page surfaces
  - landing
  - login/register
  - invite
  - offline
  - dashboard
  - wallets overview and wallet sub-pages
  - settings language/theme interactions
- Final verification commands
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`

## Assumptions
- The existing partial i18n implementation is the baseline and should be completed, not replaced with a new library.
- `id` remains the fallback locale and canonical source for untranslated keys.
- “Full i18n” for this document means all user-facing UI, metadata, and message content, but not API contract redesign or documentation site translation.
- English copy should be production-ready, not placeholder-quality.
- The plan should include cleanup of mixed inline translation branches where they block maintainability, but should avoid unrelated refactors outside the i18n path.
