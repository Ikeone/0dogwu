# Progress

Branch `cursor/productionisation-e7a1`. Labels: VERIFIED · IMPLEMENTED_NOT_YET_VERIFIED (INYV) · BLOCKED_EXTERNAL · NOT_STARTED.

Automated tests: **93 passing** (16 files). Lint (type-aware strict) + typecheck + build: green.

## Phase status (continuation prompt)
| Phase | Scope | Status |
|---|---|---|
| 1 | Runtime/toolchain (Node 22 LTS pin, engines, script aliases, type-aware strict ESLint) | **VERIFIED** — lint/typecheck/test/build green |
| 2 | PostgreSQL conversion | INYV — schema/indexes/roles/compose authored; **no Docker/psql in build VM** to run |
| 3 | Hardship/dispute/suspension safety | **VERIFIED** — models, guard, atomic concurrency-safe suspension, admin+portal UI, worker expiry, 9 tests |
| 4 | Reconciliation + reliable background processing | PARTIAL/VERIFIED — job lease recovery + stuck-order + hold expiry reconcilers + worker heartbeat; payment/shipping reconcilers NOT_STARTED |
| 5 | Auth/MFA/roles/account-lifecycle | PARTIAL — MFA + recovery codes + step-up + maker-checker VERIFIED (prior); password-reset/email-verification/session-mgmt + new roles NOT_STARTED |
| 6 | Application security | PARTIAL/VERIFIED — nonce CSP + headers + rate limiting + **audit-integrity export digest** VERIFIED; distributed rate-limit store + secret-manager abstraction NOT_STARTED |
| 7 | Evidence/privacy/retention | PARTIAL — encrypted private evidence + magic-byte + signed access + retention job (dry-run) present; malware scan interface only; privacy-case workflow UI NOT_STARTED |
| 8 | Payments/billing/refunds/disputes | PARTIAL — mock payments + webhook idempotency + refund (step-up) VERIFIED; Stripe test adapter + dunning/credit models NOT_STARTED |
| 9 | Shipping/email/SMS/object storage | PARTIAL — interfaces + mock/console/local adapters present; real sandbox adapters BLOCKED_EXTERNAL |
| 10 | Chorus integration framework | PARTIAL — provider-neutral interfaces + HTTP client + auth + mapping seams + fail-closed modes present; spec-import scripts + `FibreInactivityEligibilityProvider` NOT_STARTED; endpoints BLOCKED_EXTERNAL |
| 11 | WN/Phoenix network activation | PARTIAL — provider-neutral provisioning + distinct network state documented; `NetworkSubscriberProvider` explicit interface NOT_STARTED; BLOCKED_EXTERNAL |
| 12 | AI + knowledge management | PARTIAL/VERIFIED — KB-only assistant + citations + escalation + injection controls + account tools VERIFIED; KM lifecycle workflow + eval-suite harness NOT_STARTED |
| 13 | Customer/staff UI completion | PARTIAL — core journeys + new hardship UI present; full staff surface (jobs/DLQ/providers/feature-flags panels) NOT_STARTED |
| 14 | Comprehensive testing | PARTIAL — 93 unit/integration; E2E specs present (browsers needed); load/a11y scripts present (k6/browsers needed) |
| 15 | Deployment/ops | PARTIAL — docker-compose + readiness gates + reconcilers; full IaC/CI/CD + monitoring NOT_STARTED |

## This session (delivered + tested)
- Phase 1 complete (toolchain + strict lint, 7 issues fixed).
- Phase 3 complete (the flagged top-priority gap) with 9 tests.
- Phase 6 audit-integrity export digest with 4 tests.
- Reconciliation extended with hold expiry.

See `docs/CONTINUATION.md` for the exact next task, `docs/EXTERNAL_INPUTS_REQUIRED.md` for blockers, and `docs/BUILD_LOG.md` for commands.
