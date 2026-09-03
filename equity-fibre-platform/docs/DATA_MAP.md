# Data map

Synthetic demo data only. This maps the data elements the platform handles, their purpose, and handling rules. "AI provider?" = whether the element may be sent to an external AI provider (default: **No**; the assistant only receives approved knowledge + the question).

| Data element | Purpose | Source | Storage | Who can access | External recipient | Retention | Deletion | Overseas? | AI provider? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Name | Contact, application | Customer | `CustomerProfile`/`EligibilityApplication` | Customer (own), Ops, Super Admin | Courier (delivery) | Life of account + legal min | Cascade + retention job | TBD (Q40/Q41) | No |
| Email / phone | Contact, notifications | Customer | `CustomerProfile`/application | Customer (own), Ops, Super Admin | Email/SMS provider | Life of account | Cascade | TBD | No (masked in previews) |
| Address | Eligibility, delivery, provisioning | Customer + provider | `Address` | Customer (own), Ops | Chorus, courier | Life of service + legal | Cascade | TBD | No |
| ONT / inactivity status | Eligibility | Provider (mock) | `Address` | Ops | — | Life of application | Cascade | No | No |
| Household category | Eligibility | Customer | `EligibilityApplication` | Ops, Privacy | — | Life of application | Cascade | TBD | No |
| Eligibility evidence (CSC/MSD) | Eligibility verification | Customer upload | Encrypted private storage; `EligibilityEvidence` metadata | Privacy, Ops (time-limited, audited) | Authorised verifier (future) | `evidence.retentionDays` (365 default, Q44) | Retention job (dry-run + delete) | **No** (must stay onshore-approved) | **Never** |
| Consent records | Lawful basis | Customer | `ConsentRecord` | Ops, Privacy | — | Long (evidentiary) | Restricted | No | No |
| Payment references | Billing | Payment provider | `PaymentTransaction`/`PaymentEvent` | Finance, Super Admin | Payment provider | Financial retention (Q45) | Restricted | Provider-dependent | No |
| Modem identifiers (MAC/serial) | Provisioning, assignment | Inventory import | `ModemDevice`/`ExternalOrderReference` | Ops | Network/provisioning provider | Life of device | Retire | Provider-dependent | No |
| Support conversations | Support, quality | Customer + assistant | `SupportConversation`/`SupportMessage` | Support, Super Admin | AI provider (if enabled) | Documented retention (TBD) | Access/deletion on request | If Anthropic enabled | Redacted context only |
| Audit events | Accountability | System | `AuditEvent` (append-only) | Ops/Privacy/Finance/Super Admin | — | Long | Not deletable by staff | No | No |
| Session tokens | Auth | System | `Session` (hashed) | System | — | ≤12h | On logout/expiry | No | No |

Notes: card numbers/CVC/track data are **never** collected or stored. Logs exclude/redact all PII and secrets (`src/lib/logger.ts`).
