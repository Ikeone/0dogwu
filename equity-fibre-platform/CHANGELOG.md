# Changelog

All notable changes to the Equity Fibre platform demo.

## [0.1.0] — 2026-09-03
Initial working demo.

### Added
- Modular-monolith scaffold: Next.js 15 (App Router), TypeScript strict, Tailwind, Prisma (SQLite demo), Zod, Vitest, Playwright config, background worker.
- Env validation + typed business configuration; production hard-stops for demo secrets / mock money / mock provisioning.
- Domain: state machines (application/order/device/subscription), deterministic eligibility rules engine, pricing + modem contribution, MAC normalisation/validation, PII redaction, retry classification/backoff.
- Provider interfaces + mock adapters (address, payment, provisioning, shipping, notifications, storage, AI) + factory; Chorus HTTP client/auth/mapping scaffolds; Anthropic scaffold.
- Services: applications, orders, atomic modem assignment, payments (webhook idempotency), provisioning job processor (retry/backoff/dead-letter), shipping, notifications outbox, support (AI + tools + escalation), audit, metrics, runtime config, demo controls.
- Auth: server sessions (HttpOnly cookie, idle+absolute expiry, id rotation), deny-by-default RBAC, scrypt passwords, demo one-click logins gated on `DEMO_MODE`.
- Customer UI: landing, multi-step eligibility wizard, simulated checkout, ownership-enforced portal, privacy requests, AI support chat.
- Staff UI: dashboard, applications + manual review, provisioning queue + retry, inventory + CSV import, payments + refunds, support tickets + knowledge editor, configuration, metrics, audit log, demo controls.
- Security: strict CSP + headers, rate limiting, encrypted private evidence storage + magic-byte sniffing + signed time-limited access (audited), redacted structured logging, append-only audit.
- Seed: synthetic scenarios A–G driven through the real service code; 22 knowledge-base articles.
- Tests: 48 passing (unit + integration). Lint, typecheck, build green.
- Documentation suite under `docs/` (architecture, workflow, integrations, security, privacy, deployment, runbook, demo script, test report, assumptions/open questions, real-integration checklist).

### Notes
- Demo only; all external integrations are mocked and clearly labelled. Not production-ready.
