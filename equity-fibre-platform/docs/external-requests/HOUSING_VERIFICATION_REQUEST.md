# Housing / school eligibility verification request (BLOCKED_EXTERNAL: HOUSE-001)

Send to: WN → Kāinga Ora / community housing providers / Ministry of Education (Equity Index). No API integrated; handled via MANUAL_DOCUMENT_REVIEW / PARTNER_ATTESTATION.

| # | Exact artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| H1 | Is there an API/data feed to confirm a household is in public/community housing? | Authoritative housing check | Kāinga Ora / CHPs | OpenAPI/feed | No | both | housing verification provider | Address/household confirmed |
| H2 | Approved partner-attestation process + authorised signatories | Pilot path | WN + CHPs | SOP + list | No | `PARTNER_ATTESTATION` | Attestation recorded + audited |
| H3 | Ministry of Education Equity Index lookup by school (threshold ≥ 490) | School pathway | MoE/WN | dataset/API | No | school pathway | School index resolves; ≥490 qualifies |
| H4 | Exactly what child-related data (if any) is required | Data minimisation | WN privacy | doc | No | school schema | We collect no child name/ID unless required |
| H5 | Legal basis + notice for housing/school verification | Compliance | WN legal | doc | No | privacy notices | Notice references recorded |

Default (pending): school pathway DISABLED at launch; collect no child identifiers. Status: NOT REQUESTED — 2026-09-03.
