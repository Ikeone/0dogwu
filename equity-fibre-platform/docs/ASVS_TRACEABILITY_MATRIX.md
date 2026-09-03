# ASVS traceability matrix (OWASP ASVS 5.0, target L2)

Baseline: ASVS 5.0 Level 2 for this internet-facing app; L3 considered for evidence/payment/admin. This is a working traceability sample, not an independent certification. Status labels per project convention.

| ASVS area | Control | Implementation | Evidence | Status | Owner |
|---|---|---|---|---|---|
| V1 Architecture | Documented trust boundaries, provider seams | `docs/PRODUCTION_ARCHITECTURE.md`, factory | docs | VERIFIED | Arch |
| V2 Authentication | Server sessions, hashed tokens, idle+absolute expiry, id rotation | `auth/session.ts` | code | VERIFIED | Sec |
| V2 Auth (MFA) | Staff TOTP + recovery codes; enforced in PILOT/PROD | `auth/mfa.ts`, readiness SEC-020 | test | VERIFIED (lib) / INYV (enforcement path) | Sec |
| V2 IdP | OIDC SSO for staff | adapter contract | — | BLOCKED_EXTERNAL (OPS-001) | WN IT |
| V3 Session | HttpOnly/SameSite/Secure cookies; step-up elevation | `session.ts` | code | VERIFIED / INYV(step-up test) | Sec |
| V4 Access control | Deny-by-default RBAC + object ownership + maker-checker | `auth/rbac.ts`, `apiGuard.ts`, `approvals.ts` | tests | VERIFIED | Sec |
| V5 Validation | Zod on all inputs; ORM params; output escaping (React) | route handlers | tests | VERIFIED | Eng |
| V5 File upload | Magic-byte sniff, allow-list, size, quarantine, private storage | `services/evidence.ts` | tests | VERIFIED (demo storage) | Sec |
| V7 Crypto | AES-256-GCM field encryption; scrypt passwords; no home-grown crypto | `security/fieldCrypto.ts` | test | VERIFIED (lib) | Sec |
| V7 Key mgmt | KMS-managed keys + rotation | key source | — | BLOCKED_EXTERNAL (OPS-001) | WN IT |
| V8 Data protection | PII/secret redaction in logs; minimisation | `logger.ts`, `redaction.ts` | tests | VERIFIED | Priv |
| V9 Comms | TLS/HSTS at edge | `next.config.mjs` HSTS; edge TLS | — | INYV (edge in infra) | DevOps |
| V10 Malicious code | SAST/secret scan/SBOM in CI | CI workflow | — | INYV (CI to add) | DevOps |
| V11 Business logic | State machines, idempotency, kill switches | `domain/*`, `services/*` | tests | VERIFIED | Eng |
| V12 Files/resources | Signed, expiring, audited evidence access | `api/evidence/[key]` | code | VERIFIED | Sec |
| V13 API | Rate limits, body-size limits, CSRF posture (SameSite) | routes, middleware | partial tests | INYV | Sec |
| V14 Config | Fail-closed prod mode; secrets not in code | `env.ts`, `mode.ts` | tests | VERIFIED | Sec |
| V50 Web frontend | Nonce CSP, secure headers, no open redirects | `middleware.ts` | header evidence | VERIFIED | Sec |

Independent verification (pen test) is required before Gate C — see `PENETRATION_TEST_SCOPE.md`.
