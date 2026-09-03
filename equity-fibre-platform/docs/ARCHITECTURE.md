# Architecture

## Shape
A **modular monolith**: one Next.js (App Router) application with clear internal domain boundaries, plus a separate background **worker** process, backed by a single relational database. This avoids needless microservices while keeping seams that could later be split if scale ever justified it (it won't at ~10k households).

```
Browser ─▶ Next.js (App Router)
             ├─ Server Components (customer + staff pages)
             ├─ Route Handlers (/api/*)  ── validate (Zod) ─▶ Services
             └─ Auth (cookie session, RBAC)
Services ─▶ Domain (pure logic) + Prisma (DB) + Provider interfaces
Provider factory ─▶ mock | chorus | stripe | ... adapters
Worker process ─▶ polls IntegrationJob queue ─▶ Services (provisioning + retries)
```

## Layers (dependency direction points inward)
1. **UI** (`src/app/**`, `src/components/**`) — React server/client components. No business rules.
2. **API route handlers** (`src/app/api/**`) — thin: authenticate, validate with Zod, call a service, shape the response.
3. **Services** (`src/lib/services/**`) — orchestration + transactions + audit. The only layer that touches Prisma and providers together.
4. **Domain** (`src/lib/domain/**`) — pure, deterministic, unit-tested logic (state machines, eligibility, pricing, MAC, redaction, retry). No I/O.
5. **Providers** (`src/lib/providers/**`) — typed interfaces + adapters. Domain/services depend on interfaces only.
6. **Config/auth/db/logger** — cross-cutting (`src/lib/config`, `src/lib/auth`, `src/lib/db.ts`, `src/lib/logger.ts`).

## Key decisions
- **Deterministic core, mocked edges.** All business decisions (eligibility, billing triggers, pricing) are deterministic and tested; only external systems are mocked, behind a factory that fails loudly rather than silently mocking in production.
- **State machines over free strings.** Every stateful entity has an allowed-transition map; transitions are guarded and audited (`src/lib/domain/stateMachine.ts`).
- **Durable jobs over inline HTTP.** External work runs as `IntegrationJob`s with retry/backoff/dead-letter and an idempotency key, processed by the worker or the admin "run queue" affordance.
- **Idempotency everywhere it matters.** Webhook event ids stored once; modem assignment guarded by a unique constraint + transaction.
- **Security & privacy by construction.** Server-side RBAC + ownership; redacted logs; encrypted private evidence; append-only audit.

## Persistence
Prisma ORM. **Demo:** SQLite (`prisma/dev.db`) for zero-infra runs. **Production:** switch the datasource `provider` to `postgresql` and `DATABASE_URL` to managed Postgres, then use `prisma migrate` (see `docs/DEPLOYMENT.md`). Enum-like fields are stored as validated strings (SQLite has no enums); the domain layer is the source of truth for allowed values.

## Deviations from the brief (honest notes)
- Implemented as a single Next.js app with internal modules rather than a pnpm workspace of separate packages. The module boundaries mirror the requested package layout (`domain`, `database`, `auth`, `config`, `integrations`, `payments`, `provisioning`, `shipping`, `notifications`, `ai-support`, `security`, `ui`), and could be extracted into workspace packages later. This keeps the demo simpler to run and reason about.
- Demo auth is a small, honest session implementation, not a full IdP/MFA. See `docs/SECURITY_LIMITATIONS.md`.
