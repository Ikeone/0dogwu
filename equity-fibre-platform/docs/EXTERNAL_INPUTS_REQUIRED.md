# External inputs required

Consolidated list of everything that blocks completing an external integration. Detailed request docs (exact artifacts, formats, acceptance tests) are in `docs/external-requests/*`. Blocker IDs are stable.

| ID | Needed | Owner | Blocks | Acceptance test |
|---|---|---|---|---|
| CHORUS-001 | Chorus RAML/OpenAPI, sandbox+prod credentials, product-offer ID, webhook-signature spec, base URLs, mTLS/cert reqs | Chorus / WN | `emma`/`live` Chorus provider, endpoints, notification verification, `FibreInactivityEligibilityProvider` | Sandbox feasibility→order→notification round-trip; signed webhook verified |
| NET-001 | WN/Phoenix network system identity + interface + activation event + identifiers | WN network | `NetworkSubscriberProvider`, true "active" state | Activate/suspend in test; ACTIVE only on real access event |
| PAY-001 | Payment provider choice + sandbox/live merchant + webhook secret + settlement schema + proration/GST rules | WN finance / provider | Real payment adapter, dunning, reconciliation | Sandbox charge + signed idempotent webhook + settlement match |
| MSD-001 | CSC / MyMSD verification API or approved manual SOP | MSD / WN | Authoritative eligibility-evidence path | Definitive verify result / SOP followed |
| HOUSE-001 | Housing / school (Equity Index ≥490) verification or attestation | Kāinga Ora / CHP / MoE | Authoritative household path | Household/school confirmed |
| MODEM-001 | Exact modem model, manifest format, identifiers, manual | Supplier / WN | Model-specific KB, manifest import, device identifiers | Manifest imports; KB published |
| COUR-001 | Courier API + credentials + tracking webhooks | WN logistics | Real shipping adapter | Label + delivered event updates status |
| COMM-001 | Email + SMS provider + credentials + domain auth (DKIM/SPF/DMARC) | WN comms | Real notification delivery + bounce suppression | Sandbox send + suppression |
| OPS-001 | Cloud account + NZ/AU region + managed Postgres + S3 + KMS/secret manager + OIDC IdP + WAF + malware scanner | WN IT | Postgres runtime, prod secrets, SSO, storage, scanning | `readiness:production` PASS on real infra; restore test measured |
| LEGAL-001 | PIA sign-off, terms/AUP/cancellation/complaints, DPAs/overseas, contact authority, PCI matrix, retention schedule, suspension policy | WN legal/privacy | Retention job enable, lead import, launch | PIA=APPROVED; policies published; retention enabled |

## Exact remaining externally-blocked mappings (where official request/response goes)
- Chorus DTO↔domain mapping: `src/lib/providers/chorus/mapping.ts`; endpoint table `CHORUS_ENDPOINTS` in `src/lib/providers/chorus/client.ts` (deliberately empty — do not invent).
- Provisioning/network payload mapping: the concrete `ProvisioningProvider` / `NetworkSubscriberProvider` adapter (to be added under `src/lib/providers/<provider>/`).
- Payment provider event mapping: a `StripePaymentProvider.parseWebhook` (or WN's provider) implementing `PaymentProvider`.
- Courier/email/SMS: concrete adapters implementing the interfaces in `src/lib/providers/types.ts`, wired in `factory.ts`.

Rule: `emma`/`sandbox`/`live`/production modes must never silently fall back to `mock` (enforced by `ProviderDisabledError` + mode policy).
