# Environment & provider mode matrix

Authoritative mode: `SYSTEM_MODE = DEMO | SANDBOX | PILOT | PRODUCTION`.
Each provider mode: `DISABLED | MOCK | MANUAL | SANDBOX | PRODUCTION`.
Implemented in `src/lib/config/mode.ts` (pure, unit-tested) + enforced at startup (`src/lib/config/env.ts`) and at call time (`src/lib/providers/factory.ts`). Readiness gates: `scripts/readiness.ts`.

## Allowed provider modes per system mode
| System mode | Allowed provider modes | Mocks? | Notes |
|---|---|---|---|
| DEMO | DISABLED, MOCK, MANUAL | Yes | Synthetic data; demo controls for authorised demo admins |
| SANDBOX | + SANDBOX | Yes | Real provider sandboxes; no live money/orders; no real household contact |
| PILOT | DISABLED, MANUAL, SANDBOX, PRODUCTION | **No** | Approved cohort; MANUAL verification allowed; live providers only after approval; kill switches + monitoring |
| PRODUCTION | MANUAL, SANDBOX, PRODUCTION | **No** | Mocks, demo accounts/routes, SQLite, console notifications, local disk storage, weak/default secrets, silent fallbacks are **fatal** |

## Fail-closed controls in PRODUCTION (codes)
| Code | Rule |
|---|---|
| MODE-002 | No provider may be MOCK |
| MODE-003 | Critical providers (provisioning, network, payment) may not be DISABLED |
| MODE-010 | DEMO_MODE must be false |
| SEC-010/011 | AUTH_SECRET / FIELD_ENCRYPTION_KEY must be real (not demo placeholders) |
| SEC-012 | Object storage must not be local disk |
| DB-010 | Database must be PostgreSQL (not `file:` SQLite) |

Additional readiness gates (`readiness:production`): SEC-020 staff MFA enforced, ELIG-010 approved rule set, PRIV-010 approved evidence retention.

## No silent fallback
`ProviderDisabledError` (factory) is thrown if a mock is requested in PILOT/PRODUCTION. Unimplemented real adapters throw an explicit "not implemented" error. If AI is unavailable in production, the assistant must show a deterministic fallback + create a ticket (never a fabricated answer). If a critical provider is unavailable, the affected workflow pauses (kill switch / MANUAL).

## Evidence
- `scripts/readiness.ts production` on the demo env → **FAIL, exit 1** (12 issues) — see `artifacts/readiness/<ts>/readiness-production-demo.log`.
- Same gate with a fully-configured production env → **PASS, exit 0** — see `readiness-production-configured.log`.
- `getEnv()` throws at startup in PRODUCTION with demo secrets/mocks (same policy).

## Kill switches
`accept_applications, modem_payments, recurring_billing, chorus_orders, network_activation, shipping, outbound_email, outbound_sms, ai_support, lead_imports` (`src/lib/services/killSwitch.ts`). Changing one is audited; in PILOT/PRODUCTION requires maker-checker. Enforced in `applications.submitApplication` and `payments.createModemCheckout` (others: IMPLEMENTED_NOT_YET_VERIFIED — registry present, enforcement points to be extended).
