# CLAUDE.md — guidance for future AI coding sessions

This file orients an AI assistant working on this repository. Follow it.

## What this is
A demo Equity Fibre automation platform: Next.js (App Router) modular monolith + a background worker, Prisma (SQLite in demo, Postgres in prod), TypeScript strict.

## Architecture rules
- **Modular monolith.** Do not add microservices. Keep domain boundaries in `src/lib/*`.
- **Domain depends only on provider *interfaces*** (`src/lib/providers/types.ts`), never on Chorus/Stripe/courier DTOs. Concrete adapters map provider payloads to domain types inside their own package.
- **All provider selection goes through the factory** (`src/lib/providers/factory.ts`). In integration mode, unimplemented adapters must throw a clear error — **never silently fall back to a mock**.
- **All commercial values** live in `src/lib/config/business.ts` (or `SystemConfiguration` for runtime overrides). Do not scatter prices/rules through the code.

## Security rules (non-negotiable)
- Enforce RBAC and customer ownership **on the server** (`src/lib/auth/*`, `withCapability`). Never rely on hidden UI.
- Never log secrets, tokens, uploaded file content, or full provider payloads with PII. Use `logger` (auto-redacts) and `redactObject`.
- Never store card data — only provider references. Webhooks: verify signatures, use raw body, store each external event id once (idempotency).
- Evidence: private encrypted storage, random keys, magic-byte sniffing, time-limited signed access, audited. Never serve from the public dir.
- Do not commit secrets. Production must refuse to start with demo secrets or mock money/provisioning.

## State-machine & audit integrity
- Never set a status field directly — go through the guarded transition functions (`assertTransition` + the per-entity `transition*` service functions) so invalid transitions are rejected and every change is audited.
- Preserve idempotency: a duplicate webhook must not double-charge or double-transition; a modem must never be assigned to two active services.

## Testing commands
`npm run lint` · `npm run typecheck` · `npm run test` · `npm run build` · `npm run check` (all four). Reset demo data with `npm run db:reset`.

## Documentation update requirements
After any structural change, update **`FILE_MAP.md`** (every file explained) and **`PROJECT_STATUS.md`** (real status, not a template). If you change business assumptions, update `docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md`. Record test outcomes in `docs/TEST_REPORT.md`.

## Do not
- Do not describe mocked integrations as live.
- Do not claim production-readiness because it runs or tests pass.
- Do not weaken security controls to make a build pass.
