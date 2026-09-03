# Security

The platform handles sensitive personal, financial and eligibility information. This documents the controls implemented in the demo and the gaps that must be closed before production. See also `THREAT_MODEL.md`, `INCIDENT_RESPONSE.md`, `SECURITY_LIMITATIONS.md`.

## Authentication
- Server-side sessions: random opaque token, **SHA-256 hashed at rest**, `HttpOnly` + `SameSite=Lax` cookie, `Secure` in production (`src/lib/auth/session.ts`).
- Session id rotates on login; **idle (2h) + absolute (12h)** expiry.
- Staff passwords hashed with **scrypt** (`src/lib/auth/password.ts`).
- Generic login failure messages (no user enumeration); login/recovery rate-limited.
- Demo one-click logins are gated on `DEMO_MODE` and disabled in production.
- **Gap for production:** MFA for staff; a maintained auth library/IdP; account-recovery flow.

## Authorisation
- **Deny-by-default** RBAC (`src/lib/auth/rbac.ts`): capabilities → roles; every admin API uses `withCapability` (`src/lib/auth/apiGuard.ts`).
- **Customer ownership** enforced on the server for every protected record (portal + AI account tools query by the authenticated user id).
- Role boundaries: e.g. Support cannot perform finance/privacy actions; evidence access limited to Operations/Privacy/Super Admin.

## Input & application security
- All input validated server-side with **Zod**; Prisma parameterised queries (no string SQL).
- Strict **Content-Security-Policy** + `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (`next.config.mjs`).
- Rate limiting on login, address search, submission, and AI (`src/lib/rateLimit.ts`).
- Request body-size guards on webhooks; generic public errors (no stack traces to users).
- **Gap:** SSRF protections are inherent (no user-supplied outbound URLs); add explicit allow-lists if that changes. CAPTCHA hook present but disabled.

## File upload security
- Evidence stored in **private, encrypted (AES-256-GCM) storage** with **random object keys** (no traversal), outside the public dir (`src/lib/providers/mock/storage.ts`).
- **Magic-byte sniffing** (not extension) restricts to PNG/JPEG/PDF; strict size limit (`src/lib/services/evidence.ts`).
- **Time-limited signed access**, gated additionally by the `evidence.access` capability; every view/download is audited (`src/app/api/evidence/[key]/route.ts`).
- Malware-scan **interface** modelled (`malwareState`); production must block downloads until a scan passes (enforced when `APP_ENV=production`). Retention/deletion job has a dry-run mode.
- **Gap:** integrate a real malware scanner and private cloud storage (S3) for production.

## Secrets
- Validated at startup (`src/lib/config/env.ts`); server-only; never sent to the browser; never logged.
- `.env*` git-ignored. Production refuses to start with demo secrets, or with mock payment/provisioning/Chorus.
- **Gap:** use a cloud secrets manager + rotation in production.

## Logging
- Structured logs pass through `redactObject` (`src/lib/logger.ts`): names/addresses/emails/phones/CSC/MSD docs/passwords/tokens/payment data/API creds/AI prompts/file content are excluded or redacted. Internal + correlation ids used instead.

## Webhooks
- Verify provider signature against the **raw** body; store each event id once; idempotent processing; body-size limits (pattern in `src/app/api/webhooks/payment/route.ts`).

## Dependencies & build
- Locked versions (`package-lock.json`). Run `npm audit` before release; document exceptions. Lint + typecheck + tests + build gate in `npm run check`.
- Do not silence security warnings to make a build pass.
