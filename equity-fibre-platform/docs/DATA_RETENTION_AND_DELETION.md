# Data retention & deletion

Implemented mechanism: two-stage retention job with **dry-run report → approved deletion → deletion verification → immutable audit** (`src/lib/services/evidence.ts::runRetentionJob`). **Retention jobs remain DISABLED until WN's approved schedule is configured** (LEGAL-001). Production readiness fails if evidence is collected without an approved policy (readiness gate PRIV-010).

| Data | Retention (working default) | Trigger | Legal hold | Deletion method |
|---|---|---|---|---|
| Eligibility evidence | 365 days (UNAPPROVED — Q44/LEGAL-001) | `retentionUntil` | supported | object delete + row delete + audit |
| Application/decision/consent | account life + legal min | manual | supported | restricted (evidentiary) |
| Payment references | financial-record period | policy | mandatory hold | restricted |
| Support conversations | TBD | policy | supported | on request |
| Audit events | long | — | — | not deletable by staff (append-only) |
| Sessions | ≤12h | expiry | — | auto |
| TOTP secrets | account life | disenrol | — | clear on disenrol |

## Customer rights
- Access/correction/deletion/restriction via `/portal/privacy` (structured privacy-case workflow: identity verification, assignment, deadlines, fulfilment evidence, approval — case model present; full workflow UI is IMPLEMENTED_NOT_YET_VERIFIED).
- Machine-generated data export: PLANNED (endpoint to add); deletion respects financial/legal holds.

## IPP3A indirect collection
Any Chorus/referral/lead data received after 1 May 2026 must record source, date, purpose, data-sharing agreement reference, consent/contact basis, whether an IPP3A notice was already supplied (with evidence), suppression, retention/expiry, provenance hash/batch ID (`Lead`/`IndirectCollectionNotice`). Lead import stays **BLOCKED** until the legal basis is approved.

## Operating the job
`runRetentionJob(true)` → dry-run count; after approval, `runRetentionJob(false)` on a schedule (worker cron). Every deletion audited (`evidence.deleted_retention`).
