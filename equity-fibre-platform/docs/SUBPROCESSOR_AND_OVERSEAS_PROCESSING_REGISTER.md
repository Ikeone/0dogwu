# Subprocessor & overseas-processing register

To be completed with signed DPAs before pilot/production (LEGAL-001). No real subprocessors are connected in the demo.

| Subprocessor | Service | Data categories | Region | Overseas? | DPA / model clauses | Status |
|---|---|---|---|---|---|---|
| Cloud host (TBD — OPS-001) | Compute/DB/storage | all (at rest) | NZ/AU target | maybe | required | NOT SIGNED |
| Managed PostgreSQL (TBD) | Database | all | NZ/AU target | maybe | required | NOT SIGNED |
| Object storage (S3-compatible, TBD) | Evidence | RESTRICTED evidence | NZ target | prefer onshore | required | NOT SIGNED |
| Payment provider (PAY-001) | Payments | payment refs | provider region | likely | required + PCI | NOT SELECTED |
| Email provider (COMM-001) | Email | contact + message | provider region | likely | required | NOT SELECTED |
| SMS provider (COMM-001) | SMS | phone + message | provider region | likely | required | NOT SELECTED |
| AI provider (optional) | Support LLM | redacted support context only | provider region | likely | required; no sensitive data | DISABLED by default |
| Courier (COUR-001) | Delivery | name/address | NZ | no | required | NOT SELECTED |
| Offshore support (optional) | Case handling | masked contact only | Myanmar? (Q41) | **yes** | contract + technical minimisation | NOT APPROVED |
| Monitoring/error (TBD) | Observability | redacted logs/metrics | provider region | maybe | required; PII redaction | NOT SELECTED |

## Controls already in code
- Evidence never sent to AI/overseas by default; AI receives only approved knowledge + question.
- Offshore role is READ_ONLY with masked contact/address and audited access; JIT elevation requires approval.
- `AWS_REGION` + provider modes allow selecting NZ/AU regions.

## Required before use
Signed DPA/model clauses, region confirmation, data-category limitation, and an approved overseas-processing assessment for every subprocessor and offshore access (IPP12 + cross-border rules).
