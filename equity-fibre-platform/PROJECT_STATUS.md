# PROJECT_STATUS

**Last updated:** 2026-09-03
**Phase:** Demo complete — working end-to-end vertical slice with mock integrations.

## Summary
A runnable Next.js modular-monolith demo of the Equity Fibre platform covering the full customer and staff journeys with deterministic mock providers, automated tests, and documentation.

## Completed
- Project scaffold (Next.js 15 App Router, TS strict, Tailwind, Prisma+SQLite, Zod, Vitest, Playwright config).
- Env validation + typed business configuration; production hard-stops for demo secrets / mock money / mock provisioning.
- Domain: state machines (application/order/device/subscription), deterministic eligibility rules engine, pricing + modem contribution, MAC normalise/validate, PII redaction, retry classification/backoff.
- Providers: typed interfaces + mock adapters (address, payment, provisioning, shipping, notifications, storage, AI) + factory; Chorus HTTP client + auth + mapping scaffolds; Anthropic scaffold.
- Services: applications, orders, modems (atomic assignment), payments (webhook idempotency), provisioning job processor (retry/backoff/dead-letter), shipping, notifications outbox, support (AI + tools + escalation), audit, metrics, config, demo controls.
- Auth: server session (HttpOnly cookie, idle+absolute expiry, id rotation), RBAC (deny-by-default), scrypt passwords, demo one-click logins gated on DEMO_MODE.
- Customer UI: landing, multi-step eligibility wizard, simulated checkout, portal (ownership-enforced), privacy requests, AI support chat.
- Staff UI: dashboard, applications list/detail + manual review, provisioning queue + retry, inventory + CSV import, payments + refunds, support tickets + knowledge editor, configuration, metrics, audit log, demo controls.
- Security: strict CSP + headers, rate limiting, encrypted private evidence storage + magic-byte sniffing + signed time-limited access (audited), redacted structured logging, append-only audit.
- Seed: synthetic scenarios A–G driven through the real service code.
- Tests: 48 passing (unit + integration). Lint, typecheck, build all green.
- Manual walkthrough recorded (customer journey, staff console, customer portal).

## In progress
- None blocking. Documentation suite finalised in this change.

## Deferred / not built (by design)
- Live Chorus / Feenix / payment / courier / SMS / email / Anthropic / S3 adapters (scaffolds + interfaces only).
- Government-document authenticity verification; MFA for staff; malware scanner implementation.
- Full Playwright E2E run (config present; requires browser install in CI).
- Postgres migration (schema is Postgres-ready; demo uses SQLite).

## Assumptions made
See `docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md` (Q1–Q50). Key demo defaults: price GST-inclusive (Q19), customer modem contribution $55 (Q25), billing at activation (Q29), 14-day grace (Q30), launch scope = government/community housing + CSC (Q1).

## Blockers (for going live, not for the demo)
- Chorus API docs + sandbox/production credentials (Q16–Q18).
- Chosen provisioning topology (Q12–Q15) and payment provider (Q22).
- Legal sign-off on privacy statement & customer terms (Q46).

## Tests last run
`npm run lint` ✓ · `npm run typecheck` ✓ · `npm run test` → 48 passed ✓ · `npm run build` ✓ (39 routes). Details in `docs/TEST_REPORT.md`.

## Known limitations
- SQLite for demo (documented Postgres path). Demo auth is minimal (not an IdP). In-memory rate limiter (per-process). See `docs/SECURITY_LIMITATIONS.md`.

## Most recently changed files
- `docs/*` (documentation suite), `README.md`, `PROJECT_STATUS.md`, `FILE_MAP.md`, `CLAUDE.md`, `CHANGELOG.md`.
