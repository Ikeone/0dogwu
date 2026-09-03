# FILE_MAP

Every source file, its purpose, and classification. **Class**: `demo` (demo-only), `shared` (used in demo + prod), `prod` (production-facing logic/extension point).

## Root / config
| Path | Purpose | Class |
| --- | --- | --- |
| `package.json` | Scripts + pinned dependencies | shared |
| `tsconfig.json` | TS strict config (`noUncheckedIndexedAccess`, etc.); excludes `tests/e2e` | shared |
| `next.config.mjs` | Security headers + strict CSP | prod (security) |
| `tailwind.config.ts` / `postcss.config.mjs` | Styling; brand palette | shared |
| `.eslintrc.json` | Lint rules | shared |
| `vitest.config.ts` | Test config + test env (SQLite) | shared |
| `playwright.config.ts` | E2E config (best-effort) | shared |
| `.env.example` | Documented env template (no secrets) | shared |
| `.gitignore` | Ignores `.env*`, `node_modules`, `.next`, DB, `storage/` | shared (security) |
| `next-env.d.ts` | Next types | shared |

## Prisma / data
| Path | Purpose | Class |
| --- | --- | --- |
| `prisma/schema.prisma` | Full data model (SQLite demo; Postgres-ready) | shared |
| `prisma/seed.ts` | Seeds staff/customers, KB, inventory, scenarios A–G via real services | demo |
| `prisma/reset.ts` | Cross-platform DB reset (rm + push + seed) | demo |

## Config
| Path | Purpose | Class |
| --- | --- | --- |
| `src/lib/config/business.ts` | **All** commercial values + runtime-overridable keys | shared |
| `src/lib/config/env.ts` | Zod env validation; provider selectors; production hard-stops | prod (security) |
| `src/lib/config/brand.ts` | Placeholder brand (replace with real assets) | demo |

## Domain (pure, tested)
| Path | Purpose | Class |
| --- | --- | --- |
| `src/lib/domain/stateMachine.ts` | Generic guarded transitions | shared |
| `src/lib/domain/applicationState.ts` / `orderState.ts` / `deviceState.ts` / `subscriptionState.ts` | Allowed-transition maps | shared |
| `src/lib/domain/eligibility.ts` | Deterministic eligibility rules engine | shared |
| `src/lib/domain/pricing.ts` | Price/GST + modem contribution + unit economics | shared |
| `src/lib/domain/billing.ts` | Billing/payment trigger logic | shared |
| `src/lib/domain/mac.ts` | MAC normalise/validate (multicast/dup/invalid) | shared |
| `src/lib/domain/redaction.ts` | PII redaction (logs, AI, previews) | shared (security) |
| `src/lib/domain/retry.ts` | Error classification + backoff | shared |

## Providers (interfaces + adapters)
| Path | Purpose | Class |
| --- | --- | --- |
| `src/lib/providers/types.ts` | Domain-facing provider interfaces | shared |
| `src/lib/providers/factory.ts` | Selects adapters; throws (never silent-mock) in integration mode | prod |
| `src/lib/providers/mock/address.ts` | Deterministic synthetic address/site (no real data) | demo |
| `src/lib/providers/mock/payment.ts` | Full mock payment + HMAC-signed webhooks | demo |
| `src/lib/providers/mock/provisioning.ts` | Mock provisioning + transient-fault helper | demo |
| `src/lib/providers/mock/shipping.ts` | Mock courier | demo |
| `src/lib/providers/mock/notifications.ts` | Console email/SMS (redacted) | demo |
| `src/lib/providers/mock/storage.ts` | Local **encrypted** private evidence storage; safe-key guard | demo (security) |
| `src/lib/providers/mock/ai.ts` | Knowledge-base AI provider (no key) | shared |
| `src/lib/providers/anthropic/ai.ts` | Guarded Anthropic scaffold | prod (extension) |
| `src/lib/providers/chorus/client.ts` | Chorus HTTP client + OAuth2 auth scaffold (endpoints empty) | prod (extension) |
| `src/lib/providers/chorus/mapping.ts` | Chorus DTO↔domain mapping seam | prod (extension) |

## AI
| Path | Purpose | Class |
| --- | --- | --- |
| `src/lib/ai/search.ts` | Deterministic KB search + ranking | shared |
| `src/lib/ai/escalation.ts` | Immediate-escalation rules + prompt-injection detection | shared (security) |
| `src/lib/knowledge/articles.ts` | Seed knowledge content (model-specific flagged) | demo |

## Services (orchestration)
| Path | Purpose | Class |
| --- | --- | --- |
| `src/lib/services/applications.ts` | Submit + evaluate + manual review; creates orders | shared |
| `src/lib/services/orders.ts` | Order/subscription transitions + activation + billing + orchestration | shared |
| `src/lib/services/modems.ts` | Import + atomic single-use assignment + device transitions | shared |
| `src/lib/services/payments.ts` | Checkout + webhook idempotency + monthly + refund | shared (security) |
| `src/lib/services/provisioning.ts` | Durable job processor: retry/backoff/dead-letter | shared |
| `src/lib/services/shipping.ts` | Shipment progression + device advance | shared |
| `src/lib/services/notifications.ts` | Customer notification outbox (PII-minimised) | shared |
| `src/lib/services/support.ts` | AI answers + escalation + account tools (ownership) | shared (security) |
| `src/lib/services/evidence.ts` | Upload validation (magic bytes) + retention job | shared (security) |
| `src/lib/services/audit.ts` | Append-only audit + IP hashing | shared (security) |
| `src/lib/services/config.ts` | Runtime business config merge + change log | shared |
| `src/lib/services/metrics.ts` | Dashboard + unit-economics metrics | shared |
| `src/lib/services/demo.ts` | Demo event simulation (DEMO_MODE-gated) | demo |

## Auth / cross-cutting
| Path | Purpose | Class |
| --- | --- | --- |
| `src/lib/auth/session.ts` | Server sessions (cookie, expiry, rotation); `require*` guards | prod (security) |
| `src/lib/auth/password.ts` | scrypt hashing + token hashing | prod (security) |
| `src/lib/auth/rbac.ts` | Roles + capabilities (deny-by-default) | prod (security) |
| `src/lib/auth/apiGuard.ts` | `withCapability` wrapper for API routes | prod (security) |
| `src/lib/db.ts` | Prisma singleton + zero-config DB fallback | shared |
| `src/lib/logger.ts` | Structured logging with auto-redaction | shared (security) |
| `src/lib/http.ts` | Client IP from proxy headers | shared |
| `src/lib/rateLimit.ts` | In-memory fixed-window limiter (demo) | demo (security) |
| `src/lib/ids.ts` | Human refs + idempotency keys | shared |
| `src/worker/index.ts` | Background worker process (polls job queue) | shared |

## App — customer UI
| Path | Purpose | Class |
| --- | --- | --- |
| `src/app/layout.tsx` / `globals.css` | Root layout + styles + DEMO banner | shared |
| `src/app/page.tsx` | Landing page | shared |
| `src/app/eligibility/page.tsx` | Multi-step eligibility wizard | shared |
| `src/app/checkout/[orderId]/page.tsx` + `CheckoutButtons.tsx` | Simulated hosted checkout | demo |
| `src/app/portal/page.tsx` | Customer portal (ownership-enforced) | shared |
| `src/app/portal/privacy/page.tsx` + `PrivacyForm.tsx` | Privacy/data requests | shared |
| `src/app/support/page.tsx` | AI support chat | shared |
| `src/app/login/page.tsx` | Demo one-click + password login | shared |
| `src/components/*` | `Brand`, `DemoBanner`, `SiteHeader`, `ui` primitives | shared |

## App — admin UI
| Path | Purpose | Class |
| --- | --- | --- |
| `src/app/admin/layout.tsx` | Staff shell + role-gated nav | prod (security) |
| `src/app/admin/page.tsx` | Dashboard | shared |
| `src/app/admin/applications/page.tsx` + `[id]/*` | List + detail + manual review + evidence viewer | shared |
| `src/app/admin/provisioning/page.tsx` + `RetryButton.tsx` | Queue + retry | shared |
| `src/app/admin/inventory/page.tsx` + `InventoryTools.tsx` | Inventory + CSV import | shared |
| `src/app/admin/payments/page.tsx` + `RefundButton.tsx` | Payments + refunds | shared |
| `src/app/admin/support/page.tsx` + `TicketActions.tsx` + `KnowledgeEditor.tsx` | Tickets + KB | shared |
| `src/app/admin/config/page.tsx` + `ConfigEditor.tsx` | Business config (audited) | shared |
| `src/app/admin/metrics/page.tsx` | Unit economics | shared |
| `src/app/admin/audit/page.tsx` | Audit log | shared |
| `src/app/admin/demo/page.tsx` + `DemoControls.tsx` | Simulate external events | demo |

## App — API routes
| Path | Purpose | Class |
| --- | --- | --- |
| `src/app/api/auth/{login,demo-login,logout}/route.ts` | Auth (demo-login gated on DEMO_MODE) | prod (security) |
| `src/app/api/config/public/route.ts` | Non-sensitive config for UI | shared |
| `src/app/api/eligibility/{address-search,submit}/route.ts` | Address search + submit (+ evidence) | shared |
| `src/app/api/checkout/simulate/route.ts` | Simulated checkout outcome (DEMO) | demo |
| `src/app/api/webhooks/payment/route.ts` | Payment webhook (raw body + signature) | prod (security) |
| `src/app/api/support/{ask,tool}/route.ts` | AI ask + account tools (ownership) | shared (security) |
| `src/app/api/privacy/request/route.ts` | Privacy requests | shared |
| `src/app/api/evidence/[key]/route.ts` | Signed, capability-gated evidence access (audited) | prod (security) |
| `src/app/api/admin/*` | Capability-gated staff actions (decide, demo, config, inventory, payments/refund, provisioning/retry, support/resolve, knowledge/save, evidence/sign) | prod (security) |

## Tests
| Path | Purpose |
| --- | --- |
| `tests/unit/*.test.ts` | eligibility, mac, state, pricing, redaction, support/AI+retry, billing/file-sniff |
| `tests/integration/*.test.ts` | webhook idempotency, modem single-use + MAC rejection |

## Productionisation additions (branch `cursor/productionisation-e7a1`)
| Path | Purpose | Class |
| --- | --- | --- |
| `src/lib/config/mode.ts` | SYSTEM_MODE + provider mode policy (fail-closed), pure/testable | prod (security) |
| `scripts/readiness.ts` | `readiness:pilot`/`readiness:production` gates (non-zero on violations) | prod |
| `src/lib/services/killSwitch.ts` | Kill-switch registry + workflow guards | prod |
| `src/lib/domain/eligibilityRuleSet.ts` | Versioned configurable rule set (ALL/ANY, verification paths) | shared |
| `src/lib/auth/mfa.ts` | Staff TOTP MFA + single-use recovery codes | prod (security) |
| `src/lib/security/fieldCrypto.ts` | AES-256-GCM field encryption (KMS in prod) | prod (security) |
| `src/lib/services/approvals.ts` | Maker-checker approval workflow | prod (security) |
| `src/lib/services/reconciliation.ts` | Lease recovery + stuck-order reconciliation | prod |
| `src/middleware.ts` | Per-request nonce CSP | prod (security) |
| `src/app/api/auth/mfa/*`, `.../step-up` | MFA enrol/confirm + step-up routes | prod (security) |
| `src/app/api/admin/approvals/route.ts` | Checker side of maker-checker | prod (security) |
| `docker-compose.yml` | Local Postgres/MinIO/ClamAV/Mailpit dev stack | shared |
| `prisma/schema.prisma` | + MFA/recovery/approval/step-up models + production indexes | shared |
| `tests/unit/{mode,eligibilityRuleSet}.test.ts`, `tests/integration/{killswitch,mfa-approvals,reconciliation}.test.ts` | New productionisation tests | test |
| `docs/PRODUCTIONISATION_*`, `RELEASE_READINESS_MATRIX.md`, `EXTERNAL_BLOCKERS.md`, `ASVS_TRACEABILITY_MATRIX.md`, `ENVIRONMENT_AND_PROVIDER_MODE_MATRIX.md`, `PRODUCTION_ARCHITECTURE.md`, `ACCESS_CONTROL_MATRIX.md`, `OPERATIONAL_SLOS_AND_ALERTS.md`, `PILOT_PLAN.md`, `GO_LIVE_CHECKLIST.md`, `PENETRATION_TEST_SCOPE.md`, `PCI_RESPONSIBILITY_MATRIX.md`, `RESTORE_TEST_REPORT.md`, `PERFORMANCE_TEST_REPORT.md`, `TOM_PRODUCTION_READINESS_BRIEF.md`, `DATA_CLASSIFICATION_AND_MAP.md`, `DATA_RETENTION_AND_DELETION.md`, `SUBPROCESSOR_AND_OVERSEAS_PROCESSING_REGISTER.md`, `external-requests/*` | Productionisation + external-input docs | docs |

## Docs
See `docs/` (architecture, workflow, integrations/*, security suite, privacy suite, deployment, runbook, demo script, test report, assumptions, real-integration checklist, productionisation set) and root `README.md`, `PROJECT_STATUS.md`, `CLAUDE.md`, `CHANGELOG.md`.
