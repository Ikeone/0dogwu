# MSD eligibility verification request (BLOCKED_EXTERNAL: MSD-001)

Send to: WN → Ministry of Social Development (MSD) relationship owner. There is no MSD verification API integrated; evidence is handled via MANUAL_DOCUMENT_REVIEW.

| # | Exact artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| M1 | Is there an API to verify a Community Services Card (CSC) validity? Spec + versions | Replace manual review with authoritative check | MSD/WN | OpenAPI | No | both | `EvidenceVerificationProvider(AUTHORITATIVE_API)` | Valid/invalid CSC returns definitive result |
| M2 | Is there an API to verify a MyMSD Benefit Breakdown Letter? | Same | MSD/WN | OpenAPI | No | both | evidence provider | Letter verified/declined |
| M3 | Auth scheme + sandbox/production credentials | Access | MSD | secret | **Yes** | both | auth adapter | Token/cert accepted in sandbox |
| M4 | Exactly which fields may be collected/stored, and which must NOT be retained (e.g. CSC number, benefit amount) | Data minimisation (Q privacy) | MSD/WN privacy | doc | No | evidence schema | We store only permitted fields |
| M5 | Legal basis + privacy notice wording for verification | Compliance | WN legal | doc | No | privacy notices | Notice references recorded |
| M6 | Acceptable manual-verification process if no API | Pilot fallback | MSD/WN | SOP | No | reviewer UI | Reviewer follows SOP; outcome stored |

Default assumption (pending): store only the verification outcome/reference, NOT the CSC number or benefit amount. Status: NOT REQUESTED — 2026-09-03.
