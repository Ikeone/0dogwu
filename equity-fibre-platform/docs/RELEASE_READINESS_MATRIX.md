# Release readiness matrix

Labels: **VERIFIED** · **IMPLEMENTED_NOT_YET_VERIFIED** (INYV) · **BLOCKED_EXTERNAL** · **NOT_STARTED** · **DEFERRED_WITH_REASON** · **NOT_APPLICABLE**. "Verified" means exercised by a test or demonstrated with recorded evidence.

## Internal controls (Gate A — production candidate)
| ID | Item | Status | Evidence |
|---|---|---|---|
| MODE-1 | SYSTEM_MODE + provider mode policy | VERIFIED | `tests/unit/mode.test.ts` |
| MODE-2 | Production fail-closed (mocks/secrets/SQLite/storage) | VERIFIED | readiness logs; env.ts; mode.test |
| MODE-3 | No silent fallback (ProviderDisabledError) | VERIFIED | factory guard; mode policy |
| KILL-1 | Kill-switch registry + enforcement (applications, payments) | VERIFIED | `tests/integration/killswitch.test.ts` |
| KILL-2 | Kill-switch enforcement on all workflows | INYV | registry present; some workflows not yet wired |
| ELIG-1 | Versioned rule set (ALL/ANY, verification paths, manual-on-outage) | VERIFIED | `tests/unit/eligibilityRuleSet.test.ts` (17) |
| ELIG-2 | High-risk config maker-checker | VERIFIED | `tests/integration/mfa-approvals.test.ts` |
| SEC-1 | Staff TOTP MFA + recovery codes | VERIFIED | mfa-approvals.test |
| SEC-2 | Field encryption (AES-256-GCM) for secrets | VERIFIED | mfa-approvals.test |
| SEC-3 | Step-up auth on refunds/config | INYV | routes wired; not covered by automated test |
| SEC-4 | Nonce CSP (no unsafe-inline scripts) | VERIFIED | curl header evidence; e2e regression spec |
| SEC-5 | Rate limiting (login/upload/AI/webhooks) | INYV (login/AI/submit VERIFIED via code paths) | routes |
| SEC-6 | Secret manager / KMS | BLOCKED_EXTERNAL (OPS-001) | field-crypto key source needs KMS |
| SEC-7 | OIDC IdP for staff SSO | BLOCKED_EXTERNAL (OPS-001) | adapter contract only |
| SEC-8 | Malware scanning (real) | BLOCKED_EXTERNAL (OPS-001) | interface + quarantine state present |
| DB-1 | Postgres schema + indexes | INYV | schema `@@index`; **no Docker/psql in build VM** |
| DB-2 | Postgres migrations + concurrency (SKIP LOCKED) | INYV | documented; not run (no psql) |
| DB-3 | Backup/restore test | NOT_STARTED (blocked env) | `RESTORE_TEST_REPORT.md` |
| REL-1 | Durable jobs + retry + dead-letter | VERIFIED | existing provisioning tests |
| REL-2 | Reconciliation (lease recovery, stuck orders) | VERIFIED | `tests/integration/reconciliation.test.ts` |
| REL-3 | Transactional outbox everywhere | INYV | notifications outbox present; not universal |
| EVID-1 | Encrypted private evidence + magic-byte + signed access | VERIFIED (demo storage) | existing tests + code |
| EVID-2 | S3 storage + retention job enabled | BLOCKED_EXTERNAL (OPS-001/LEGAL-001) | local adapter; retention needs approved schedule |
| OBS-1 | OpenTelemetry traces/metrics | NOT_STARTED | structured logs present |
| PERF-1 | 10k-record load test | NOT_STARTED (tooling not run here) | `PERFORMANCE_TEST_REPORT.md` |

## External integrations (Gate B — pilot)
| ID | Provider | Status |
|---|---|---|
| CHORUS-001 | Chorus access/provisioning/assurance | BLOCKED_EXTERNAL |
| NET-001 | WN/Phoenix network SoR | BLOCKED_EXTERNAL |
| PAY-001 | Payment provider | BLOCKED_EXTERNAL |
| MSD-001 | MSD/CSC verification | BLOCKED_EXTERNAL |
| HOUSE-001 | Housing/school verification | BLOCKED_EXTERNAL |
| MODEM-001 | Modem device | BLOCKED_EXTERNAL |
| COUR-001 | Courier | BLOCKED_EXTERNAL |
| COMM-001 | Email/SMS | BLOCKED_EXTERNAL |

## Legal/privacy (Gate C — production)
| ID | Item | Status |
|---|---|---|
| LEGAL-001 | PIA sign-off + terms + DPAs + contact authority | BLOCKED_EXTERNAL |
| PRIV-010 | Approved evidence retention schedule | BLOCKED_EXTERNAL (LEGAL-001) |
| SEC-PEN | Independent penetration test | NOT_STARTED (external) |
