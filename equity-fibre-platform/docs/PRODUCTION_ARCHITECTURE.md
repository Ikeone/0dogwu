# Production architecture

Modular monolith (Next.js web) + a separate long-running worker, on managed PostgreSQL + private object storage, in an NZ/AU region. No microservices (workload is low volume ~10k households).

```
              ┌─────────── WAF / edge (TLS, HSTS, rate limit) ───────────┐
  Internet ──▶│  Next.js web (server components + API routes)             │
              │   - nonce CSP middleware                                  │
              │   - session auth + RBAC + step-up + maker-checker         │
              └───────┬───────────────────────────────┬──────────────────┘
                      │ (same codebase)                │ durable jobs (outbox / IntegrationJob)
              ┌───────▼────────┐              ┌────────▼─────────┐
              │ Services layer │              │ Worker process   │
              │ + Domain       │              │ - claim (SKIP    │
              └───┬───────┬────┘              │   LOCKED), lease │
                  │       │                   │ - retries/DLQ    │
        ┌─────────▼─┐  ┌──▼───────────┐       │ - reconciliation │
        │PostgreSQL │  │Provider факт.│       └────────┬─────────┘
        │(RLS roles │  │(Chorus/pay/  │                │
        │ + PITR)   │  │ courier/...) │────────────────┘  (idempotent adapters)
        └───────────┘  └──────────────┘
        Private S3 (evidence, encrypted) · KMS (field keys) · Secret manager · OTel sink
```

## Data layer
- Managed PostgreSQL, TLS in transit, encryption at rest, PITR. Separate DB roles: **migration**, **app read/write**, **worker**, **read-only reporting/audit**. App role cannot alter migration metadata or mutate immutable audit rows (append-only trigger / external audit sink).
- Concurrency: modem allocation + job claiming use transactions and `SELECT ... FOR UPDATE SKIP LOCKED` / row locks on PostgreSQL. Delivery is **at-least-once with idempotent consumers + reconciliation** (not exactly-once).
- Connection pooling + statement/query timeouts + slow-query logging.
- Indexes: due-job polling `IntegrationJob(status,nextRunAt)`, plus application/order/device/audit search indexes (`prisma/schema.prisma`). Partial-unique constraints to add via SQL migration: one active service per address/place; one active modem assignment; unique canonical MAC; unique provider event id; unique idempotency key; unique referral/prequal token.

## Worker
A real continuously-running process (`src/worker/index.ts`), not an accidental drain of a serverless web request. Polls the queue, processes with backoff/DLQ, and periodically reconciles (lease recovery + stuck-order flagging).

## Security seams
Server-side authz everywhere; provider factory is the only outbound seam; secrets from KMS/secret manager; nonce CSP; redacted logs; append-only audit.

## Deviations / notes
- Demo uses SQLite; production switches Prisma datasource to `postgresql` and uses `prisma migrate deploy`.
- OIDC IdP, KMS, WAF, OTel are infra integration points (BLOCKED_EXTERNAL OPS-001) with code contracts present.
