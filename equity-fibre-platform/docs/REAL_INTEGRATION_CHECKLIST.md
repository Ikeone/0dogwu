# Real integration checklist (go-live)

Work top-to-bottom. Nothing here is done in the demo; each item is scaffolded and documented.

## Business decisions (from Tom / Wireless Nation)
- [ ] Confirm launch eligibility scope (Q1), school path (Q2), evidence types (Q3).
- [ ] Confirm inactivity definition: 90 days vs 3 calendar months (Q8) and who decides eligibility (Q6).
- [ ] Confirm pricing: GST treatment (Q19), wholesale cost (Q21), customer modem contribution amount (Q24/Q25).
- [ ] Confirm billing: upfront trigger (Q23), monthly start event (Q29), grace period (Q30), suspension events (Q31).
- [ ] Confirm modem make/model + required network identifiers (Q33/Q34/Q35); BYO policy (Q32).

## Chorus (`integrations/chorus.md`)
- [ ] Obtain API spec (products + versions), product-offer id for Equity Fibre 100 (Q16/Q18).
- [ ] Obtain sandbox + production credentials (Q17). Set `CHORUS_*` env vars in the secrets manager.
- [ ] Populate `CHORUS_ENDPOINTS` and implement `mapping.ts`; add `ChorusAddressProvider` + `ChorusProvisioningProvider`; wire into the factory.
- [ ] Implement + verify Chorus webhooks/notifications (signature, idempotency, retry classification).

## Provisioning topology (`integrations/provisioning.md`)
- [ ] Decide: direct Chorus vs Feenix/Phoenix vs WN platform (Q12–Q15); confirm provider identity/spelling (Q14).
- [ ] Implement the chosen `ProvisioningProvider`; confirm which device identifiers the network needs.

## Payments (`integrations/payment.md`)
- [ ] Choose provider (Q22); implement `StripePaymentProvider` (or WN's); set `STRIPE_*`/provider secrets.
- [ ] Configure hosted checkout, webhook signature verification, recurring billing from the configured event.
- [ ] Confirm refund/return policy (Q28) and financial retention (Q45).

## Shipping (`integrations/shipping.md`)
- [ ] Choose courier (Q37); implement `ShippingProvider`; add delivery webhook (Q38).

## Notifications
- [ ] Configure email (SMTP) + SMS providers (Q47); real templates; suppression handling.

## Storage & security
- [ ] Private S3-compatible bucket; move `ObjectStorageProvider` to S3; server-side encryption + lifecycle.
- [ ] Integrate a malware scanner; block downloads until "clean".
- [ ] Secrets manager + KMS; rotate `AUTH_SECRET`/`FIELD_ENCRYPTION_KEY`; plan re-encryption.
- [ ] Staff MFA + hardened auth/IdP; shared-store rate limiting; WAF/edge.
- [ ] `npm audit` clean (or documented exceptions); add lint/typecheck/test/build + SAST to CI.

## Data & privacy
- [ ] Legal-approved privacy statement + customer terms (Q46); confirm consent wording.
- [ ] Approved evidence retention periods (Q44); enable the retention job on a schedule.
- [ ] Offshore access decisions + contracts (Q40–Q42); overseas processing controls.
- [ ] Indirect-collection notices if Chorus supplies household data (Q9/Q10).

## Infrastructure (`DEPLOYMENT.md`)
- [ ] Switch Prisma to Postgres; run `prisma migrate deploy`.
- [ ] NZ-hosted managed Postgres (backups + PITR), private storage, managed secrets, logs, monitoring, alerts.
- [ ] Separate dev/staging/prod; CI/CD with approval gate; IaC.
- [ ] Set `APP_ENV=production`, `DEMO_MODE=false`, non-mock payment/provisioning/Chorus (app enforces this).

## Verification before launch
- [ ] End-to-end test in sandbox with real providers; backup-restore test; incident-response dry run; security review.
