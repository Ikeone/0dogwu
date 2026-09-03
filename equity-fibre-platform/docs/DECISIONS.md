# Decisions (ADR-style)

Secure/pragmatic assumptions recorded per the continuation prompt. Each is revisitable.

## D1 — Package manager: keep npm (not pnpm)
The prompt references `pnpm`. The repository is built and tested with **npm** (`package-lock.json`). Switching package managers mid-project would churn the lockfile, scripts, and CI for no functional gain and some risk. **Decision:** keep npm; all `pnpm <script>` commands map 1:1 to `npm run <script>` (identical script names added: `test:unit`, `test:integration`, `test:security`, `test:a11y`, `test:load`, `readiness:staging`). If WN standardises on pnpm, converting is mechanical (`pnpm import`).

## D2 — Node runtime: pin Node 22 LTS (not 24)
The build/runtime environment provides Node **v22.14.0** (an active LTS). Node 24 LTS could not be installed here and would require a dependency-compatibility audit. **Decision:** pin Node 22 LTS via `.nvmrc`, `.node-version`, and `engines: ">=22 <25"`. Moving to Node 24 is a follow-up gated on a compatibility run in a Node-24 environment. (Node 23 is explicitly NOT used.)

## D3 — ESLint: type-aware strict rules enabled
Enabled `@typescript-eslint` type-aware rules: `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-unnecessary-type-assertion`, `switch-exhaustiveness-check`, and `no-unused-vars` as **error**. Underlying code was fixed (not suppressed); `void` is used only for intentional fire-and-forget UI handlers. Scripts/prisma/e2e/load excluded from app lint (run under tsx/k6/browsers).

## D4 — PostgreSQL: schema + migrations authored, runtime unverified in this VM
No Docker/psql is available in the build VM, so PostgreSQL cannot be *run* here. The Prisma schema is Postgres-ready, `docker-compose.yml` provides Postgres/MinIO/ClamAV/Mailpit, and migration/role/backup scripts are authored. Status: **IMPLEMENTED_NOT_YET_VERIFIED** until run on a Postgres-capable host. SQLite remains the zero-infra demo DB only.

## D5 — Suspension safety defaults (Phase 3)
Automatic suspension is **blocked** by any active hold (hardship, dispute, complaint-under-investigation, provider outage, WN billing error, vulnerable-customer, legal, manual). `suspendOnSingleFailure` stays **false**. These defaults protect low-income households and are configurable + audited. WN must confirm the final suspension policy (OPEN QUESTION).

## D6 — Proration policy: unconfirmed, configurable
No proration rule is invented. It is configurable and marked **unconfirmed** until WN supplies the rule.

## D7 — Reference payment provider: Stripe (test mode) interface only
Where WN's provider is unknown, the interface stays provider-neutral; a Stripe test-mode adapter is the documented reference. No provider is wired live (BLOCKED_EXTERNAL PAY-001).
