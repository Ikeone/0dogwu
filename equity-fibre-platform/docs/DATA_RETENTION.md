# Data retention

Retention is configurable and enforced by an automated job with a **dry-run** mode (`runRetentionJob` in `src/lib/services/evidence.ts`). Values below are working assumptions pending approval (Q44, Q45).

| Data | Default retention | Mechanism | Notes |
| --- | --- | --- | --- |
| Eligibility evidence | 365 days (`evidence.retentionDays`) | `EligibilityEvidence.retentionUntil` + retention job (delete object + row) | Approved period TBD (Q44) |
| Application records | Life of application + legal minimum | Manual/cascade | Keep decision + consent for evidentiary purposes |
| Consent records | Long (evidentiary) | Restricted | Demonstrates lawful basis |
| Payment references | Financial-record period | Restricted | Retain for finance/contract (Q45); references only, never card data |
| Support conversations | TBD | Access/deletion on request | Redacted; retention policy to confirm |
| Audit events | Long | Append-only | Not deletable by ordinary staff |
| Sessions | ≤12h absolute | Auto-expire/delete | — |

## Operating the retention job
- Run in **dry-run** first to see what would be deleted (`runRetentionJob(true)` → returns due count).
- Run for real (`runRetentionJob(false)`) on a schedule (e.g. a worker cron) once approved periods are set.
- Every deletion is audited (`evidence.deleted_retention`).

## Deletion on request
Customers can request deletion via `/portal/privacy`; the privacy officer processes it subject to legal obligations (e.g. financial record-keeping may prevent deletion of payment references).
