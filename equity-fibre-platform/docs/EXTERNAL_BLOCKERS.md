# External blockers

Each blocker: what is needed • owner • required format • acceptance test to unblock. Full detail in `docs/external-requests/`.

| ID | Blocker | Owner | Required format | Acceptance test |
|---|---|---|---|---|
| CHORUS-001 | Chorus API spec, credentials, product-offer ID, webhook signing | Chorus / WN | RAML/OpenAPI + OAuth/mTLS secrets + values | Sandbox feasibility→order→notification round-trip; signed webhook verified |
| NET-001 | WN/Phoenix network SoR + interface + activation event | WN network | interface spec + identifiers | Activate/suspend in test; ACTIVE only on real access event |
| PAY-001 | Payment provider + merchant + webhook secret + settlement | WN finance / provider | SDK + secrets + report schema | Sandbox charge + signed idempotent webhook + settlement match |
| MSD-001 | CSC / MyMSD verification API or approved manual SOP | MSD / WN | OpenAPI or SOP | Definitive verify result or SOP-followed manual outcome |
| HOUSE-001 | Housing/school (Equity Index ≥490) verification or attestation | Kāinga Ora/CHP/MoE | API/feed or SOP | Household/school confirmed |
| MODEM-001 | Exact modem model, manifest format, identifiers, manual | Supplier / WN | spec + PDF | Manifest imports; model-specific KB published |
| COUR-001 | Courier API + credentials + tracking webhooks | WN logistics | API + secrets | Label + delivered event updates status |
| COMM-001 | Email/SMS provider + credentials + domain auth | WN comms | API + secrets + DNS | Sandbox send + bounce suppression |
| OPS-001 | Cloud account, region, managed Postgres, S3, KMS/secret manager, OIDC IdP, WAF, malware scanner | WN IT | endpoints + secrets | `readiness:production` PASS against real infra |
| LEGAL-001 | PIA sign-off, terms/AUP/cancellation/complaints, DPAs/overseas, contact authority, PCI matrix, retention schedule | WN legal/privacy | signed docs | PIA=APPROVED; policies published; retention job enabled |

Rule: none of these may be marked resolved by code alone. Production launch (Gate C) stays NO-GO until CHORUS-001, NET-001, PAY-001, OPS-001, LEGAL-001 and the independent penetration test are complete.
