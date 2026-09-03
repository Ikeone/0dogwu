# Deployment

> Do not deploy production infrastructure without explicit credentials and Wireless Nation approval. The app is container-ready; this describes three levels.

## Level 1 — Local demonstration
- Web + worker on a laptop, SQLite, mock providers, synthetic data.
- `npm install && npm run db:reset && npm run dev` (+ optional `npm run worker`).

## Level 2 — Temporary public demonstration
- A managed app platform (e.g. a container host) with **synthetic data only**.
- Must: use HTTPS; keep the DEMO banner; **not** contain real customer records or evidence; keep demo/admin test controls behind authentication; set `DEMO_MODE=true` but never real credentials.
- Use a small managed Postgres (or the SQLite file on a persistent volume for a throwaway demo).

## Level 3 — Production target (design)
NZ-hosted where practical. Suggested components:
- Containerised **web** + containerised **worker**.
- **Managed PostgreSQL** (TLS, automated backups, point-in-time recovery).
- **Private** object storage (S3-compatible) with server-side encryption + lifecycle rules — never a public bucket.
- **Managed secrets** + **KMS** (for `FIELD_ENCRYPTION_KEY` and provider secrets).
- **WAF** + load balancer + HTTPS certs; centralised logs; error monitoring; metrics/alerts.
- Separate **dev / staging / production** environments; private admin access; CI/CD with an approval gate before prod; infrastructure-as-code.

### Switching to Postgres
1. In `prisma/schema.prisma` set `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL` to the managed instance.
3. Replace `prisma db push` with migrations: `prisma migrate dev` (dev) / `prisma migrate deploy` (prod).
4. Provide real provider adapters + credentials; ensure `APP_ENV=production`, `DEMO_MODE=false`, and non-mock payment/provisioning/Chorus (the app refuses to start otherwise).

### Production env must-haves
- Unique `AUTH_SECRET`, `FIELD_ENCRYPTION_KEY` (from KMS/secrets manager).
- Real `PAYMENT_PROVIDER`, `PROVISIONING_PROVIDER`, `CHORUS_ENVIRONMENT` (sandbox/production), courier, email, SMS, storage.
- Object storage = S3 (private); AI provider terms confirmed if enabled.

## Operational procedures
- **Secret rotation:** rotate via secrets manager; plan re-encryption if `FIELD_ENCRYPTION_KEY` changes.
- **DB migration:** `prisma migrate deploy` in a release step; backward-compatible migrations; run the worker after web is healthy.
- **Rollback:** redeploy previous image; migrations should be forward-compatible or paired with a down plan.
- **Backup restore test:** periodically restore a backup into staging and verify (see `RUNBOOK.md`).
- **Provider outage:** jobs retry with backoff and dead-letter; degrade gracefully; surface health in the admin queue.

## Scaling
~10,000 potential households and low transaction volume relative to typical consumer SaaS. A single modest web instance + one worker + one Postgres comfortably handles this. Scale the worker horizontally if job volume grows; add read replicas only if needed. Focus spend on reliability (backups, monitoring), not premature scale.
