# Pilot plan (controlled)

Purpose: prove the end-to-end journey with a small, approved cohort using real test/limited-live providers and manual verification where APIs are absent. Pilot is **NO-GO** until Gate B (see `GO_LIVE_CHECKLIST.md`).

## Scope
- Small approved cohort (e.g. 20–50 households) sourced via **community-partner/referral codes** (self-initiated), NOT a bulk 10,000-household import.
- SYSTEM_MODE=PILOT: mocks forbidden; MANUAL verification allowed; real providers only after approval; kill switches + monitoring on.

## Provider posture during pilot
| Provider | Pilot mode |
|---|---|
| Eligibility verification | MANUAL_DOCUMENT_REVIEW / PARTNER_ATTESTATION (until MSD/HOUSE APIs) |
| Chorus provisioning | MANUAL (ops completes real order) until CHORUS-001 |
| Network (WN/Phoenix) | MANUAL with dual-control activation until NET-001 |
| Payment | SANDBOX or limited-live once PAY-001 approved |
| Courier | MANUAL/SANDBOX until COUR-001 |
| Email/SMS | SANDBOX/live once COMM-001 |
| AI | knowledge-base only unless LLM approved; disable→ticket fallback |

## Guardrails
- Kill switches ready (intake, payments, billing, orders, activation, shipping, comms, AI, lead imports).
- Maker-checker for high-risk changes; step-up for sensitive actions; staff MFA mandatory.
- No real household contact outside the approved cohort and consented channels.
- Daily reconciliation review; incident + rollback drills completed.

## Success criteria
- Eligible + ineligible + manual-review journeys complete correctly.
- Upfront payment + activation + first monthly billing correct with idempotency.
- No PII/secret leakage; audit complete; support/escalation working.
- Metrics: manual-handling minutes/customer, containment/escalation, error rates within targets.

## Exit
Promote to production only after Gate C (external integrations verified, legal sign-off, pen test remediated, ops funded).
