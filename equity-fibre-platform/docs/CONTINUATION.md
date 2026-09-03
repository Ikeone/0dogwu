# Continuation

For the next session to resume safely.

- **Branch:** `cursor/productionisation-e7a1`
- **Latest commit:** Phase 6 audit-integrity (run `git log --oneline -8` for hashes)
- **Tests:** 93 passing (`npm run db:reset && npx vitest run`). Lint/typecheck/build green.
- **Environment caveats:** no Docker/psql → PostgreSQL runtime, restore, and load/a11y browser tests cannot run in this VM. Node 22 LTS (not 24).

## Completed & verified this session
- Phase 1 (toolchain + strict type-aware lint).
- Phase 3 (hardship/dispute/suspension safety) — full, 9 tests.
- Phase 6 audit-integrity export digest — 4 tests.
- Reconciliation extended (hold expiry).

## Exact next tasks (dependency order)
1. **Phase 5 (account lifecycle):** add models `PasswordResetToken`, `EmailVerificationToken` (hashed, single-use, short expiry); services + API routes (`/api/auth/reset/request`, `/api/auth/reset/confirm`, `/api/auth/verify-email`); session-management page (`/portal/security`, `/admin/security`) listing + revoking sessions; add roles `SECURITY_ADMIN`, `OFFSHORE_SUPPORT` to `src/lib/auth/rbac.ts` + capability matrix + masking helper for offshore. Tests: token single-use, expiry, reset revokes sessions; offshore masking.
   - First file to create: `src/lib/services/accountTokens.ts`. Then `prisma/schema.prisma` models. Then routes.
2. **Phase 4 (reconcilers):** `reconcilePayments()` + `reconcileShipping()` in `src/lib/services/reconciliation.ts` producing discrepancy records + admin resolution; add `PaymentDiscrepancy`/`ShippingDiscrepancy` models. Tests for detection.
3. **Phase 8:** `StripePaymentProvider` (test-mode reference) implementing `PaymentProvider`; dunning + credit models; wire behind `PAYMENT_MODE=SANDBOX`.
4. **Phase 10:** `pnpm chorus:spec:inspect|client:generate|contract:test` scripts (operate on a supplied spec under `docs/api-specs/chorus/`); `FibreInactivityEligibilityProvider` interface returning VERIFIED_ELIGIBLE/…; pluggable webhook-verification strategies (JWT/JWKS, HMAC, mTLS, IP, timestamp/nonce) — activate only the supplied one.
5. **Phase 2 (when Postgres available):** run `docker compose up -d postgres`, switch datasource to `postgresql`, `prisma migrate dev`, run integration tests on Postgres, execute backup/restore, record in `docs/RESTORE_TEST_REPORT.md`.

## Commands to run first in the next session
```
cd equity-fibre-platform
npm ci
npm run db:reset
npx vitest run          # expect 93 passing
npm run lint && npm run typecheck && npm run build
```

## Do-not-break invariants
- Fail-closed provider modes + `ProviderDisabledError` (no silent mock fallback).
- Suspension guard: holds block auto-suspension; atomic conditional update for concurrency.
- Append-only audit; maker-checker + step-up on high-risk actions.
- Never invent Chorus/provider endpoints or payloads.
