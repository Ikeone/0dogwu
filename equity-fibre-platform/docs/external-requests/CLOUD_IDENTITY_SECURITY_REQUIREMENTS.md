# Cloud, identity & security requirements (BLOCKED_EXTERNAL: OPS-001 / SEC-KMS)

Send to: WN IT/security owner. No cloud account, IdP, KMS or secret manager is provisioned; secrets are local `.env` in the demo.

| # | Exact artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| O1 | Chosen cloud + approved NZ/AU region | Data location | WN | decision | No | IaC | Region selected |
| O2 | Managed PostgreSQL instance (TLS, backups, PITR) + credentials | Prod DB | WN | endpoint+secret | **Yes** | staging/prod | `DATABASE_URL` | Migrate + connect over TLS |
| O3 | Private object storage (S3-compatible) bucket + keys | Evidence storage | WN | endpoint+secret | **Yes** | staging/prod | `ObjectStorageProvider(s3)` | Pre-signed upload/download works |
| O4 | KMS/secret manager | Secrets + field encryption | WN | service | **Yes** | all non-dev | `fieldCrypto` key source | Key retrieved from KMS |
| O5 | OIDC IdP (Entra ID/other) client + domain-role mapping | Staff SSO/MFA | WN | client+config | **Yes** | pilot/prod | OIDC adapter | SSO login maps to roles |
| O6 | WAF + edge rate limiting | Abuse protection | WN | service | No | infra | WAF rules active |
| O7 | TLS certs + domain | HTTPS | WN | certs/domain | partial | prod | edge | HTTPS + HSTS verified |
| O8 | Central logging/metrics/alerting sink | Observability | WN | service | partial | prod | OTel exporter | Traces/metrics visible |
| O9 | Managed malware scanner (prod) | Evidence safety | WN | service | partial | prod | scan adapter | Infected file quarantined |
| O10 | Offshore access policy (VPN/managed device/IP) for Myanmar worker (if approved) | Least privilege | WN | policy | No | offshore role | Access restricted + audited |

Status: NOT REQUESTED — 2026-09-03.
