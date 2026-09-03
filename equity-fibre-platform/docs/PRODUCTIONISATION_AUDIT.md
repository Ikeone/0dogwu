# Productionisation audit

Date: 2026-09-03. Branch: `cursor/productionisation-e7a1` (snapshot tag `pre-productionisation-<ts>`).
Baseline raw logs: `artifacts/readiness/<ts>/` (gitignored).

## Method
Audited the actual source + executed test output (not documentation claims). Ran the full baseline chain and scanned the repository for prototype markers.

## Baseline (verified, generated)
| Check | Result |
|---|---|
| typecheck (`tsc --noEmit`) | PASS |
| lint (`next lint`) | PASS (0 warnings) |
| unit + integration tests (Vitest, generated JSON) | 48/48 PASS at baseline (now 80/80 after productionisation work) |
| production build | PASS (39 routes at baseline) |
| Node | v22.14.0 (target Node LTS; see toolchain note) |
| Docker / psql available in build VM | NO (constrains Postgres runtime verification) |

## Marker scan (src/)
| Marker | Count | Notes |
|---|---|---|
| TODO/FIXME/HACK | 0 | none |
| "mock" references | 60 | mock providers + demo affordances (expected) |
| "not implemented" throws | 7 | intentional fail-loud provider guards (no silent fallback) |
| raw SQL (`queryRaw`/`executeRaw`) | 0 | ORM only |
| stray `console.*` (excl logger) | 0 | all logging via redacting logger |
| hard-coded secrets | 0 tracked | only `.env.example` + `dev-only-insecure` demo placeholders |

## Key findings reconciled
- Documentation claimed a working domain model, state machines, audit, durable worker queue, idempotency, portals, modem allocation, billing, AI, tests, deployment scaffolding. **Verified present** in source and exercised by tests. Prior test totals were reconciled to a single generated summary (see `TEST_REPORT.md`).
- Prototype shortcuts identified and addressed this pass: unversioned eligibility booleans; single `DEMO_MODE` flag without a fail-closed provider mode matrix; no MFA/step-up/maker-checker; static CSP with `unsafe-inline` for scripts; SQLite-only; no reconciliation/lease recovery; no readiness gates.
- Remaining shortcuts are external-dependent (Chorus/MSD/housing/network/payment/courier/email-SMS/cloud/legal) and are tracked as `BLOCKED_EXTERNAL` in `EXTERNAL_BLOCKERS.md`.

## Gap identifiers (stable)
See `RELEASE_READINESS_MATRIX.md` and `EXTERNAL_BLOCKERS.md` for SEC-*, PRIV-*, CHORUS-*, PAY-*, NET-*, OPS-*, LEGAL-*, MODEM-*, COUR-*, COMM-*, HOUSE-*, MSD-* items.
