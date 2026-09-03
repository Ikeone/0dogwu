# Incident response plan

A concise, actionable plan. Assign owners before launch (Q43 privacy officer; Q50 support/maintenance obligations).

## Roles
- **Incident Lead** (coordinates), **Privacy Officer** (assesses personal-information impact), **Engineering on-call** (containment/recovery), **Comms** (customer/regulator notice). One person may hold several roles at demo stage.

## 1. Detection
- Sources: error monitoring (`ERROR_MONITORING_DSN`), structured logs + correlation ids, audit trail, provider alerts, customer reports, failed-login/security events.
- Declare an incident when confidentiality/integrity/availability of personal, financial, or eligibility data is credibly at risk.

## 2. Containment
- Isolate the affected component (disable a route/provider via config, scale down, or block traffic at the edge).
- Revoke suspected sessions; disable compromised staff accounts (`user.disabledAt`).
- Stop ongoing exfiltration (rotate signed-URL secret to invalidate outstanding evidence links).

## 3. Evidence preservation
- Snapshot logs, audit events, and DB state before remediation. Do not edit audit history (append-only). Record timeline with correlation ids.

## 4. Customer impact assessment
- Identify affected individuals and data categories using the `DATA_MAP.md`. Privacy Officer assesses seriousness of harm.

## 5. Credential rotation
- Rotate `AUTH_SECRET`, `FIELD_ENCRYPTION_KEY` (note: rotating the encryption key requires a re-encryption plan for stored evidence), provider API keys/webhook secrets, and any exposed tokens. Use the secrets manager.

## 6. Provider contact
- Notify affected providers (Chorus/payment/courier) per contract; request their logs; coordinate on shared-responsibility items.

## 7. Privacy-officer involvement & notification decision
- Privacy Officer decides, with legal, whether the incident is a notifiable privacy breach (NZ Privacy Act threshold: risk of serious harm). Prepare notifications to the Office of the Privacy Commissioner and affected individuals if required. (Legal sign-off — Q46.)

## 8. Recovery
- Deploy the fix, restore from clean backups if needed (test restores per `DEPLOYMENT.md`), verify integrity, re-enable components, monitor closely.

## 9. Post-incident review
- Blameless review within a set period: timeline, root cause, what worked, action items with owners/dates. Update this plan, the threat model, and controls.

## Runbook cross-reference
Operational steps and health checks: `docs/RUNBOOK.md`.
