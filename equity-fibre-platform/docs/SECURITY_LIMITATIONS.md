# Security limitations (honest list)

This is a **demo**. The following are deliberately simplified or not implemented, and must be addressed before handling real customer data. Running locally and passing tests does **not** imply production security.

## Not implemented / simplified
- **Auth**: custom minimal session (not a maintained IdP); **no MFA** for staff; no full account-recovery flow. Replace with an established auth library + MFA.
- **Malware scanning**: only an interface + `malwareState` field. No real AV. Production blocks downloads until "clean", but nothing sets it clean yet.
- **Object storage**: local encrypted files, not a private cloud bucket. Use S3-compatible private storage with server-side encryption + lifecycle rules.
- **Database**: SQLite for the demo. Use managed Postgres with TLS, backups, PITR, and least-privilege credentials.
- **Rate limiting**: in-memory per-process. Use a shared store (Redis) + edge/WAF rate limiting.
- **Secrets**: `.env` files locally. Use a cloud secrets manager + rotation.
- **CSP**: allows `'unsafe-inline'` for styles (Tailwind/Next). Tighten with nonces/hashes where feasible.
- **Encryption key management**: `FIELD_ENCRYPTION_KEY` derives the evidence key. Use a KMS; plan key rotation + re-encryption.
- **Bot protection**: CAPTCHA hook present but disabled.
- **Dependency scanning / SAST**: not wired into CI in this repo.

## Not claimed as production-complete
Live Chorus/Feenix provisioning; government-document authenticity verification; legally-approved privacy statement/contract; telecom regulatory compliance; production payment processing; production courier integration; security certification. See the brief's "do not falsely claim" list — none of these are done.

## Compliance/legal gaps
- Privacy statement and customer terms require legal approval (Q46).
- Offshore support access needs contractual + privacy controls and a location decision (Q40–Q42).
- Evidence retention periods need confirmation (Q44).
