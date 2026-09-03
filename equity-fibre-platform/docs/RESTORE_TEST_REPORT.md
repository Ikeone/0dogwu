# Backup / restore test report

Status: **NOT EXECUTED in this environment.** The build VM has no Docker or PostgreSQL, so a real PostgreSQL backup/restore could not be performed. RPO/RTO must be **measured**, not promised.

## Planned procedure (to run in a Postgres-capable environment)
1. `docker compose up -d postgres` (or managed instance).
2. `DATABASE_URL=postgresql://... npx prisma migrate deploy && npm run db:seed`.
3. Insert a representative dataset (10k synthetic households — see `PERFORMANCE_TEST_REPORT.md`).
4. Take a base backup + note WAL position (PITR).
5. Perform mutations; record a target recovery point.
6. Restore into a fresh instance from backup + WAL to the target point.
7. Verify row counts, audit immutability, and a smoke test of key flows.
8. **Record measured RPO and RTO** here.

## Results
| Metric | Target (proposed) | Measured |
|---|---|---|
| RPO | ≤ 5 min (PITR) | NOT MEASURED |
| RTO | ≤ 1 hour | NOT MEASURED |
| Data integrity post-restore | 100% | NOT MEASURED |

Blocker: OPS-001 (managed Postgres) or a Docker-capable CI runner. Do not treat RPO/RTO as achieved until measured here.
