# Operational SLOs & alerts

These are **operational targets**, not contractual SLAs (WN must approve contractual commitments). All are configurable.

## Proposed SLOs (targets)
| SLO | Target (proposed) | Measure |
|---|---|---|
| Web availability | 99.5% monthly | edge/uptime monitor |
| Eligibility check response | p95 < 1.5s | server timing |
| Application completion (submit success) | > 98% non-error | app metric |
| Order age (created→activation) | p50 < 5 business days | order timestamps |
| Job queue age | p95 < 2 min | `IntegrationJob.nextRunAt` lag |
| Payment webhook lag | p95 < 30s | webhook receipt→processed |
| Support first response | < 1 business day (pilot) | ticket timestamps |
| Provider error rate | < 2% per provider | adapter metrics |

## Alerts (route to on-call; never leak PII)
| Alert | Trigger | Runbook |
|---|---|---|
| Auth failures spike | > N failed logins / window | RUNBOOK: possible credential stuffing |
| MFA resets | any staff MFA reset | verify identity |
| Role/config change | any change | review maker-checker record |
| Evidence access/export | any bulk/unusual access | privacy review |
| Webhook signature failures | > threshold | provider credential/rotation check |
| Provider credential errors | any | rotate/renew |
| Refund spike | > threshold / window | finance review |
| Modem assignment anomaly | duplicate/repeat | inventory reconcile |
| Kill-switch change | any | confirm authorised + expiry |
| Queue age high | > SLO | scale worker / investigate provider |
| DLQ growth | dead-lettered jobs | manual replay after root cause |

## Ownership
On-call matrix + runbooks: `docs/RUNBOOK.md`. Observability (OpenTelemetry traces/metrics with correlation IDs across web/worker/providers): **NOT_STARTED** (structured logging present) — depends on OPS-001 sink.
