# Wireless Nation — Equity Fibre Automation Platform (Demo)

A genuinely working, end-to-end **demonstration** of an automation platform for Wireless Nation's proposed **Equity Fibre** service: a low-cost fibre plan for eligible households. It shows the full customer journey (eligibility → evidence → payment → modem → provisioning → activation → billing → support) and the full staff journey (review → provisioning ops → inventory → payments → support → config → audit → metrics).

> **This is a demo with clearly-labelled mock integrations.** It is not production-ready and is not connected to any real Chorus, payment, courier, SMS, email or AI provider. Every screen shows a **“DEMO — SYNTHETIC DATA”** banner. See [What is mocked](#what-is-mocked-vs-implemented).

## Contents
- [Quick start](#quick-start)
- [Demo logins](#demo-logins)
- [What is mocked vs implemented](#what-is-mocked-vs-implemented)
- [Architecture](#architecture)
- [Commands](#commands)
- [Configuration](#configuration)
- [Testing](#testing)
- [Documentation index](#documentation-index)

## Quick start

Requires **Node.js 20+**. The demo uses SQLite, so **no database server is needed**.

```bash
cd equity-fibre-platform
npm install
cp .env.example .env.local          # optional; sensible defaults work for the demo
npm run db:reset                    # creates prisma/dev.db, pushes schema, seeds scenarios A–G
npm run dev                         # starts Next.js at http://localhost:3000
```

Open http://localhost:3000 and click **Check your eligibility**, or sign in at http://localhost:3000/login.

Optionally run the background worker in a second terminal (the demo can also process the queue from the admin **Demo controls** page, so this is optional):

```bash
npm run worker
```

### Windows PowerShell

The npm scripts are cross-platform. Equivalent steps in PowerShell:

```powershell
cd equity-fibre-platform
npm install
Copy-Item .env.example .env.local        # optional
npm run db:reset
npm run dev
# second terminal (optional):
npm run worker
```

To generate a strong local secret (either shell):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Demo logins

All accounts are synthetic. One-click sign-in is available on `/login` when `DEMO_MODE=true`. Password for every demo account is `demo1234`.

**Staff (staff console `/admin`)**

| Role | Email | Can do |
| --- | --- | --- |
| Super Admin | `admin@wn.demo` | Everything |
| Operations | `ops@wn.demo` | Applications, provisioning, inventory, demo controls |
| Support | `support@wn.demo` | Tickets, knowledge base |
| Finance | `finance@wn.demo` | Payments, refunds |
| Privacy Officer | `privacy@wn.demo` | Evidence access, privacy requests |
| Offshore (read-only) | `offshore@wn.demo` | Minimal, PII-restricted view |

**Customers (portal `/portal`)**

| Scenario | Email | State |
| --- | --- | --- |
| A | `aroha.customer@demo.nz` | Fully active service |
| G | `grace.customer@demo.nz` | Active, monthly payment in grace period |
| F | `finn.customer@demo.nz` | Provisioning retried after a transient failure |

## What is mocked vs implemented

**Genuinely implemented** (real logic, tested): eligibility rules engine, state machines (application/order/device/subscription), pricing & modem contribution, MAC normalisation/validation, atomic single-use modem assignment, durable integration jobs with retry/backoff/dead-letter, webhook idempotency, payment fulfilment flow, shipment progression, activation + billing triggers, AI knowledge-base assistant with citations + escalation + account-aware tools, RBAC + customer ownership, encrypted private evidence storage with signed access, audit trail, PII redaction, runtime business configuration.

**Mocked (safe, deterministic — NOT live)**: Chorus address/availability/provisioning, payment provider (Stripe adapter is a documented scaffold), courier, email, SMS, AI (Anthropic adapter is a guarded scaffold), object storage (local encrypted files). Each has a typed domain interface and a provider factory, so a real adapter can be dropped in per package without touching the rest of the app. See `docs/integrations/`.

**Deliberately NOT claimed as production-complete**: live Chorus/Feenix provisioning, government-document authenticity verification, legally-approved privacy statement/contract, telecom regulatory compliance, production payment processing, production courier integration, security certification.

## Architecture

A **modular monolith**: one Next.js (App Router) application containing clear domain modules, plus a separate background **worker** process, backed by a single database.

```
apps (this repo is a single Next app + worker script):
  src/app        Next.js routes (customer + staff UI, API route handlers)
  src/worker     background job processor (separate process)
packages (as src/lib modules):
  config         env validation + typed business configuration
  domain         state machines, eligibility engine, pricing, MAC, redaction, retry
  providers      typed provider interfaces + mock/chorus/anthropic adapters + factory
  services       orchestration (applications, orders, modems, payments, provisioning, shipping, support, audit, metrics, config, demo)
  auth           session, RBAC, password hashing
  ai             knowledge search + escalation rules
```

See `docs/ARCHITECTURE.md` for detail.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the web app (dev) |
| `npm run worker` | Start the background job worker |
| `npm run db:reset` | Recreate SQLite DB + seed scenarios A–G |
| `npm run db:seed` | Re-seed demo data |
| `npm run db:push` | Push Prisma schema to the DB |
| `npm run test` | Unit + integration tests (Vitest) |
| `npm run test:e2e` | Playwright E2E (best-effort; needs browsers) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run check` | lint + typecheck + test + build |

## Configuration

- Runtime env is validated with Zod at startup (`src/lib/config/env.ts`). Server-only values are never exposed to the browser.
- **Business** values (prices, eligibility scope, triggers) live in one place: `src/lib/config/business.ts`, with runtime overrides via the admin **Configuration** page (audited).
- Production refuses to start with demo secrets, or with `PAYMENT_PROVIDER=mock` / `PROVISIONING_PROVIDER=mock` / `CHORUS_ENVIRONMENT=mock`.

See `.env.example` for the full list.

## Testing

`npm run check` runs lint, typecheck, tests, and build. Actual results are recorded in `docs/TEST_REPORT.md`. Highlights: 48 automated tests (unit + integration incl. webhook idempotency and modem single-use), plus a manual walkthrough of the customer journey, staff console, and customer portal.

## Documentation index

Everything is in `docs/`:
- `ARCHITECTURE.md`, `BUSINESS_WORKFLOW.md`, `INTEGRATIONS.md`
- `integrations/chorus.md`, `integrations/payment.md`, `integrations/provisioning.md`, `integrations/shipping.md`, `integrations/ai.md`
- `SECURITY.md`, `THREAT_MODEL.md`, `INCIDENT_RESPONSE.md`, `SECURITY_LIMITATIONS.md`
- `PRIVACY_IMPACT_ASSESSMENT_DRAFT.md`, `DATA_MAP.md`, `DATA_RETENTION.md`, `OVERSEAS_ACCESS_AND_PROCESSING.md`, `PRIVACY_OPEN_QUESTIONS.md`
- `DEPLOYMENT.md`, `RUNBOOK.md`, `DEMO_SCRIPT.md`, `TEST_REPORT.md`, `REAL_INTEGRATION_CHECKLIST.md`
- `ASSUMPTIONS_AND_OPEN_QUESTIONS.md`

Project tracking: `PROJECT_STATUS.md`, `FILE_MAP.md`, `CHANGELOG.md`, and `CLAUDE.md` (guidance for future AI coding sessions).
