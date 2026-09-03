# Productionisation status

Date: 2026-09-03 · Branch `cursor/productionisation-e7a1` · Target: **production candidate (internal)**; pilot & production gated on external items.

## This pass — implemented & verified
- Environment/provider **mode policy** (`DEMO|SANDBOX|PILOT|PRODUCTION` × `DISABLED|MOCK|MANUAL|SANDBOX|PRODUCTION`) with **fail-closed production** and **no silent fallback**; readiness gates (`readiness:pilot`/`readiness:production`) that exit non-zero.
- **Kill switches** for critical workflows (registry + enforcement on applications & payments).
- **Versioned, configurable eligibility rule set** (ALL/ANY groups, four verification paths, authoritative-precedence, manual-review-on-outage, never auto-approve a government doc), wired into submissions; 17 tests.
- **Staff TOTP MFA** + hashed single-use recovery codes; **field encryption** (AES-256-GCM) for TOTP secrets; **step-up auth** on refunds/config; **maker-checker** approvals for high-risk changes.
- **Nonce-based CSP** (no `unsafe-inline` scripts) via middleware; security-header regression test.
- **PostgreSQL readiness**: production indexes, `docker-compose.yml` (Postgres/MinIO/ClamAV/Mailpit), documented migration/concurrency strategy.
- **Reconciliation** jobs (lease recovery for crashed workers; stuck-order flagging) wired into the worker.
- Tests grew **48 → 80** (all passing); lint/typecheck/build green.

## Verified vs not
- **VERIFIED** items and their evidence: see `RELEASE_READINESS_MATRIX.md`.
- **IMPLEMENTED_NOT_YET_VERIFIED**: PostgreSQL runtime (no Docker/psql in this VM), step-up automated test, universal kill-switch wiring, universal outbox.
- **BLOCKED_EXTERNAL**: all real provider integrations + legal/privacy sign-off + cloud/KMS/IdP (see `EXTERNAL_BLOCKERS.md`).
- **NOT_STARTED**: OpenTelemetry, load/DR execution (need infra), independent pen test.

## Release gate summary
- **Gate A (production candidate):** substantially advanced; **NOT PASSED** — remaining internal INYV items (Postgres runtime verification, full test/security suites, staging deploy) require an environment with Docker/Postgres.
- **Gate B (controlled pilot):** NO-GO — external provider sandboxes + approvals outstanding.
- **Gate C (production launch):** NO-GO — external integrations, legal sign-off, pen test outstanding.

## Next (see final report's "next 10 actions")
Postgres runtime verification → staging deploy + smoke → Chorus/payment sandbox adapters once specs arrive → OTel + load/DR → pen test → legal sign-off.
