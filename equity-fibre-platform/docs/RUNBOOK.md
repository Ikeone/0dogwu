# Operations runbook

## Start / stop (local)
- Start web: `npm run dev` (or `npm run build && npm start`).
- Start worker: `npm run worker`.
- Reset demo data: `npm run db:reset`.

## Health checks
- Web: `GET /` returns 200; `GET /api/config/public` returns JSON.
- DB: `npx prisma studio` (browse) or `npm run db:push` (schema in sync).
- Jobs: admin → Provisioning shows job statuses; worker logs `worker.tick`.

## Common tasks
| Task | How |
| --- | --- |
| Reprocess the integration queue | Admin → Demo controls → "Run provisioning queue", or run the worker |
| Retry a dead-lettered job | Admin → Provisioning → "Retry job" (audited) |
| Resolve a manual-review application | Admin → Applications → filter "manual review" → decide (reason required, audited) |
| Import modem stock | Admin → Modem inventory → CSV import or single add |
| Refund a payment | Admin → Payments → Refund (finance role; reason required, audited) |
| Change a business rule | Admin → Configuration (super admin; reason required, audited) |
| View who accessed evidence | Admin → Audit log (filter `evidence`) |
| Run evidence retention (dry-run) | Call `runRetentionJob(true)` (worker/cron); then `false` to delete |

## Incident triage
1. Check error monitoring + `logger` output (correlation ids).
2. Check the audit log for the affected entity.
3. For provider failures: inspect the integration job attempt log; retry if transient.
4. For suspected security/privacy incidents: follow `INCIDENT_RESPONSE.md`.

## Backups & restore (production)
- Managed Postgres automated backups + PITR.
- Restore test: restore latest backup into staging, run `prisma migrate deploy`, smoke-test key flows, confirm row counts vs source.

## Provider outage handling
- Jobs retry with exponential backoff; permanent errors dead-letter for manual action.
- Payments/provisioning are idempotent, so re-processing after recovery is safe.
- Communicate status; do not disable idempotency guards.
