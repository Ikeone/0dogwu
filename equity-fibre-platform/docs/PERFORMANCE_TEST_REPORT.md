# Performance & scale test report

Status: **NOT EXECUTED in this environment** (no PostgreSQL/load infra in the build VM). Design + plan below; results to be measured on Postgres.

## Context
Low monthly margin ⇒ operational/cloud cost control is a product requirement. Volume is modest: ~10,000 potential households, low transactions relative to typical consumer SaaS. The modular monolith + PostgreSQL job queue is expected to suffice (do NOT add Redis/Kafka/K8s without measured evidence).

## Planned dataset
≥ 10,000 synthetic households/applications + realistic services, payments, jobs, messages, audit rows (a generator to be added under `scripts/`).

## Planned tests (k6/Artillery)
- Eligibility/address-check bursts
- Simultaneous application submissions
- Concurrent modem allocation (contention on `SKIP LOCKED`)
- Chorus webhook bursts + duplicates (idempotency under load)
- Monthly billing batch + notification batch
- Support/AI traffic; admin dashboard/search; privacy export

## Metrics to capture
Latency (p50/p95/p99), throughput, DB connections, slow queries, queue lag, memory, failure rate. Add indexes/query changes from evidence (baseline indexes already added in `schema.prisma`).

## Budgets (proposed)
- Mobile page interactive < 3s on 3G-class connection (audience may have limited bandwidth).
- Per-environment cloud/AI/SMS/email cost estimates + budget alerts; AI usage capped + observable.
- Track cost per active service and manual-handling minutes per application/customer.

Blocker: OPS-001 (Postgres + runner). Results table intentionally empty until measured.
