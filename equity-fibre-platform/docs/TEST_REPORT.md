# Test report

Actual commands and outcomes. Re-run with `npm run check` (lint + typecheck + test + build).

## Automated

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | ✅ No ESLint warnings or errors |
| Type-check | `npm run typecheck` (`tsc --noEmit`) | ✅ Passed |
| Unit + integration tests | `npm run test` (Vitest) | ✅ **48 passed** across 9 files |
| Production build | `npm run build` | ✅ Succeeded (39 routes) |

### Test coverage by area (48 tests)
- **Eligibility rules** (11): eligible social-housing, eligible qualifying-school (when enabled), recently-active, no ONT, missing evidence, unsupported/out-of-scope, duplicate active service, provider conflict → manual review, provider unavailable → manual review, never-active ONT, automatic vs manual flagging.
- **MAC** (5): multi-format normalisation, wrong length/non-hex rejected, multicast rejected, all-zero/broadcast rejected, valid unicast accepted.
- **State machines** (5): valid + invalid order transitions, device lifecycle order, subscription cannot resurrect from cancelled, application terminal states.
- **Pricing** (5): GST split, $55 default modem contribution, full price when deduction disabled, never negative, positive per-customer contribution.
- **Redaction** (3): email/phone scrub, email masking, sensitive-key object redaction.
- **Support/AI + retry** (10): KB ranking, no unpublished results, deterministic ordering, immediate safety/payment escalation, no false escalation, prompt-injection detection, error classification, bounded backoff.
- **Billing + file sniffing** (5): billing triggers (activation default + delivery override), payment-before-shipment, magic-byte accept PNG/JPEG/PDF, reject ELF/PE executables.
- **Integration — webhook idempotency** (2): duplicate payment webhook is ignored (no double-charge/transition; single PaymentEvent; single succeeded txn; single modem assignment); bad-signature webhook rejected.
- **Integration — modem single-use** (2): idempotent assignment for the same order; unique-constraint prevents assigning one device to two orders; invalid + duplicate MACs rejected on import.

## Manual (browser) walkthrough
Performed against `npm start` at http://localhost:3000, recorded as screen captures:
1. **Customer journey** — landing → eligibility wizard → decision (with per-rule reasons) → AI support answer with citations → safety escalation with ticket.
2. **Staff console** — Super Admin dashboard → Demo controls activating a Scenario F order → Provisioning showing an integration job with **`retryable_error → success` (attempts 2/5)** → manual-review application detail → inventory (MACs) → audit log.
3. **Customer portal** — active-service progress timeline (all steps green), modem card, billing status + next payment date, privacy request form.

Also verified via curl: server-side authz (unauthenticated admin/tool APIs return 401), security headers (CSP, X-Frame-Options, X-Content-Type-Options), grounded AI answers, and authenticated account-tool ownership.

## Not run here
- **Playwright E2E** (`npm run test:e2e`): config is present but a full browser run was not executed in this environment (browsers not installed). The equivalent flows were exercised via the manual browser walkthrough above.

## Honesty note
Passing these checks demonstrates the demo works end-to-end with mock integrations. It does **not** imply production-readiness or that any live external integration works. See `SECURITY_LIMITATIONS.md`.
