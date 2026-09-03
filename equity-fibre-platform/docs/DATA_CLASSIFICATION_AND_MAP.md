# Data classification & field-level map

Classification: **RESTRICTED** (sensitive personal / eligibility / financial), **CONFIDENTIAL** (personal), **INTERNAL**, **PUBLIC**. Synthetic demo data only. AI column = may be sent to an external AI provider (default No).

| Data element | Class | Purpose | Source (direct/indirect) | Storage | Encryption | Roles w/ access | External recipient / subprocessor | Region | Retention | Deletion | AI? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name | CONFIDENTIAL | contact/application | direct | CustomerProfile/App | at-rest (DB) | customer(own), Ops, SuperAdmin | courier | NZ/AU (target) | account life + legal | cascade + job | No |
| Email/phone | CONFIDENTIAL | notifications | direct | profile/app | at-rest | customer(own), Ops | email/SMS provider | NZ/AU | account life | cascade | masked only |
| Address | CONFIDENTIAL | eligibility/delivery/provisioning | direct + provider | Address | at-rest | customer(own), Ops | Chorus, courier | NZ/AU | service life + legal | cascade | No |
| ONT/inactivity | INTERNAL | eligibility | provider | Address | at-rest | Ops | — | NZ/AU | application life | cascade | No |
| Household category | RESTRICTED | eligibility | direct | App | at-rest | Ops, Privacy | — | NZ/AU | application life | cascade | No |
| Eligibility evidence (CSC/MSD) | RESTRICTED | verification | direct upload | private object store (encrypted) + metadata | **field/object encryption** | Privacy, Ops (time-limited, audited) | authorised verifier (future) | NZ (target, onshore) | approved schedule (BLOCKED LEGAL-001) | retention job + verify | **Never** |
| CSC number / benefit amount | RESTRICTED | (avoid) | direct | **not stored** unless contract requires | n/a | n/a | n/a | n/a | n/a | n/a | Never |
| Consent records | CONFIDENTIAL | lawful basis | direct | ConsentRecord | at-rest | Ops, Privacy | — | NZ/AU | long (evidentiary) | restricted | No |
| Payment references | RESTRICTED | billing | provider | PaymentTransaction/Event | at-rest | Finance, SuperAdmin | payment provider | provider region | financial retention | restricted | No |
| Card PAN/CVC | RESTRICTED | (never) | n/a | **never stored** | n/a | none | provider (hosted) | provider | n/a | n/a | Never |
| Modem MAC/serial | INTERNAL | provisioning | inventory | ModemDevice/refs | at-rest | Ops | network provider | NZ/AU | device life | retire | No |
| TOTP secret | RESTRICTED | staff MFA | system | User.mfaSecretEnc | **AES-256-GCM (KMS in prod)** | system only | — | NZ/AU | account life | on disenrol | Never |
| Support conversations | CONFIDENTIAL | support | direct + AI | SupportMessage | at-rest | Support, SuperAdmin | AI provider (if enabled) | provider region | documented (TBD) | on request | redacted context only |
| Audit events | INTERNAL | accountability | system | AuditEvent (append-only) | at-rest | Ops/Priv/Fin/SuperAdmin | — | NZ/AU | long | not staff-deletable | No |
| Session tokens | RESTRICTED | auth | system | Session (hashed) | hash | system | — | NZ/AU | ≤12h | expire/logout | No |

Audit source: staff access to RESTRICTED items (evidence, payment) is logged (`AuditEvent`). Indirect collection (Chorus/referral) requires IPP3A notice tracking — see `DATA_RETENTION_AND_DELETION.md` and PRIVACY docs.
