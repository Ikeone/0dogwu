# Threat model (practical)

Scope: the Equity Fibre platform handling PII, eligibility evidence, and payment references. Method: assets → actors → threats (STRIDE-ish) → mitigations → residual risk.

## Assets
- Customer PII (name, contact, address), eligibility evidence (CSC/MSD documents), payment provider references, service/order state, staff accounts, audit trail, secrets.

## Actors
- Anonymous internet users, authenticated customers, staff (by role), offshore read-only operator, external providers (Chorus/payment/courier/AI), malicious insider, compromised dependency.

## Key threats & mitigations
| Threat | Vector | Mitigation | Residual |
| --- | --- | --- | --- |
| Horizontal privilege escalation | Customer A reads B's data | Server-side ownership checks on every record; account tools derive id from session | Low |
| Vertical privilege escalation | Support performs finance action | Deny-by-default RBAC + `withCapability` on every admin API | Low |
| Evidence exfiltration | Guessing/replaying evidence URLs | Random keys, encryption at rest, signed+expiring links, capability gate, audit | Low–Med (add malware scan + S3) |
| Malicious upload | Executable disguised as image | Magic-byte sniffing, allow-list, size cap, private storage | Med (add AV scan) |
| Payment tampering / double-charge | Replayed/forged webhook | Signature verify (raw body) + event-id idempotency + guarded transitions | Low |
| Double modem assignment | Concurrency | Transaction + unique constraint on assignment | Low |
| Session theft | XSS/cookie leak | HttpOnly+SameSite+Secure, CSP, id rotation, idle/absolute expiry | Med (add MFA) |
| Credential exposure | Secrets in logs/repo/errors | Redacted logs, env-only secrets, `.env` ignored, prod refuses demo secrets | Low |
| Prompt injection / AI misuse | Hostile chat input | Injection detection, KB-grounded answers, no state-changing AI, read-only ownership-checked tools | Low |
| Data over-collection / offshore access | Minimisation failure | Data minimisation, redaction, PII-restricted offshore role, audit of staff access | Med (needs legal/contractual controls Q40–Q42) |
| SSRF | User-supplied URLs | No user-controlled outbound fetches | Low |
| Supply-chain | Malicious dependency | Locked versions, `npm audit`, minimal deps | Med |
| DoS | Flooding public endpoints | Rate limiting, body-size limits | Med (add WAF/edge in prod) |

## Trust boundaries
Browser ⇄ server (all authz on server); server ⇄ external providers (signed webhooks, credentialed outbound); staff console ⇄ sensitive data (RBAC + audit); offshore operator (minimised view).

## Top residual risks to close before production
1. Staff MFA + hardened auth/IdP.
2. Real malware scanning + private cloud object storage.
3. Legal/contractual controls for offshore access + overseas processing.
4. Secrets manager + rotation; WAF/edge rate limiting; dependency audit in CI.
