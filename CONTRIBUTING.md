# Contributing to Balance

Thank you for considering contributing to **Balance** — the personal & household finance tracker.

This project is licensed under **AGPL-3.0**. By contributing, you agree that your contributions will be licensed under the same license.

## Code of Conduct

Be respectful, constructive, and professional. We're all here to build something useful.

## Getting Started

1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/balance.git
   cd balance
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

See the [README](README.md) for full setup instructions including Supabase and Docker.

## Development Workflow

1. Create a branch for your change:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes.
3. Run type checking and tests:
   ```bash
   npm run typecheck
   npm run test:unit
   ```
4. Commit using [conventional commits](https://www.conventionalcommits.org/):
   ```
   feat: add multi-currency support
   fix: resolve wallet balance miscalculation on refunds
   docs: update deployment guide
   refactor: extract transaction validation helper
   test: add unit tests for recurring scheduler
   ```
5. Push and open a Pull Request.

## Code Conventions

- **TypeScript strict mode** — avoid `any` unless no practical alternative.
- **Double quotes** and **semicolons** — match the existing codebase.
- **Import alias** — use `@/` for app, component, and lib imports.
- **Server-only code** — guard with `import "server-only"` where appropriate.
- **AI agents** — see [AGENTS.md](AGENTS.md) for detailed guidance for AI coding tools.

## Testing

- Write unit tests for pure helpers, mappers, date math, and permission logic.
- Use the existing Vitest setup:
  ```bash
  npm run test:unit
  ```
- Prefer deterministic tests that don't require a live Supabase instance.

## Feature Flags & Self-Hosted Mode

Balance runs in two modes:

| Mode | `SELF_HOSTED_MODE` | Description |
|------|-------------------|-------------|
| **Self-hosted** | `true` | All features unlocked, no billing checks |
| **SaaS** | `false` | Feature gated by subscription status |

When adding premium features, gate them through `lib/features.ts`:

```typescript
import { isFeatureAvailable } from "@/lib/features";

if (isFeatureAvailable(userPlan, "ai_chat")) {
  // enable AI chat
}
```

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Include tests for new functionality.
- Update documentation (README, PRD, etc.) if behavior changes.
- Make sure CI passes (typecheck + tests).

## Questions?

Open a [discussion](https://github.com/FeverEpidemic/balance/discussions) or check the existing [issues](https://github.com/FeverEpidemic/balance/issues).
