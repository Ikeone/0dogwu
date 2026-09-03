# Access control matrix

Deny-by-default. Capabilities → roles in `src/lib/auth/rbac.ts`; enforced server-side via `withCapability` + object-ownership checks. High-risk actions additionally require **step-up** and (PILOT/PROD) **maker-checker**.

| Capability | SUPER_ADMIN | OPERATIONS | SUPPORT | FINANCE | PRIVACY_OFFICER | READ_ONLY (offshore) |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| dashboard.view | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| applications.review/decide | ✔ | ✔ | | | | |
| evidence.access (signed, audited) | ✔ | ✔ | | | ✔ | |
| provisioning.operate | ✔ | ✔ | | | | |
| inventory.manage | ✔ | ✔ | | | | |
| payments.view | ✔ | | | ✔ | | |
| payments.refund (step-up + maker-checker) | ✔ | | | ✔ | | |
| support.handle / knowledge.edit | ✔ | | ✔ | | | |
| config.view | ✔ | ✔ | | ✔ | | |
| config.edit (step-up + maker-checker) | ✔ | | | | | |
| privacy.handle | ✔ | | | | ✔ | |
| audit.view | ✔ | ✔ | | ✔ | ✔ | |
| demo.control (DEMO only) | ✔ | ✔ | | | | |

## Offshore (READ_ONLY) restrictions
Assigned cases only; masked contact/address where full values are unnecessary; **no** payment credentials; **no** eligibility documents by default; no bulk exports; no role/config changes; MFA + short sessions; full access audit; just-in-time elevation requires approval. (Masking helper + JIT elevation: registry present; full UI enforcement is IMPLEMENTED_NOT_YET_VERIFIED pending WN approval of the offshore model — LEGAL-001/OPS-001.)

## Step-up + maker-checker required for
Refunds/credits, role changes, evidence access/download, eligibility-rule changes, billing/suspension policy changes, customer-data export, provider-config/kill-switch changes.

## Tested boundaries
IDOR/ownership, role confusion, unauthenticated admin APIs (401), self-approval rejection — see `tests/` + `tests/e2e/security.spec.ts`.
