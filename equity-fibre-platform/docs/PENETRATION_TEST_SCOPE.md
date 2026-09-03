# Penetration test scope

The application must not self-certify. This scopes an independent test before Gate C.

## In scope
- Public web (marketing, eligibility wizard, support), customer portal, staff console, all API routes, webhook endpoints, file upload/download (evidence), auth (login, MFA, recovery, step-up, session), maker-checker approval flows.
- Test environment: dedicated staging with synthetic data only (no real customers/evidence).

## Test classes (map to our security suites)
- AuthN/Z: IDOR/object ownership, privilege escalation, role confusion, disabled users, session fixation/theft, MFA bypass, reset-token replay, step-up bypass.
- Input: XSS (stored/reflected), SQLi/ORM injection, template injection, CSV formula injection, mass assignment, prototype pollution, path traversal, host-header, open redirect, SSRF.
- Files: malicious upload (spoofed MIME/magic bytes, decompression bombs), signed-URL replay, cross-account access.
- Webhooks: signature spoof/replay/out-of-order, oversized payloads.
- AI: prompt injection (incl. encoded/obfuscated), data exfiltration, cross-customer requests, action attempts.
- Rate limiting/abuse, secret/PII log leakage, CSP/headers, TLS config.

## Rules of engagement
- Synthetic data only; no live payments/provider calls; coordinate timing; no destructive tests against shared infra without approval.

## Deliverables
- Findings with severity, reproduction, remediation; retest of critical/high.
- Remediation process: critical/high must be closed or formally risk-accepted by a named owner before Gate C.

Status: NOT_STARTED (external vendor required).
