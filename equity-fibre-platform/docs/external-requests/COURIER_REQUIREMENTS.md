# Courier requirements (BLOCKED_EXTERNAL: COUR-001)

Send to: WN logistics owner. Courier is MOCK; shipment progression is manual/demo-driven.

| # | Exact artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| S1 | Chosen courier | Adapter | WN | decision | No | `ShippingProvider` | Provider selected |
| S2 | Sandbox + production API + credentials | Access | courier | secret | **Yes** | both | shipping adapter | Sandbox label created |
| S3 | Label/manifest creation API | Dispatch | courier | schema | No | dispatch flow | Label generated |
| S4 | Tracking: webhook or polling? Event list | Delivery status | courier | doc | No | tracking handler | Delivered event updates status |
| S5 | Webhook signing (if any) | Verify | courier | secret | **Yes** | both | webhook verifier | Signed event verified |
| S6 | Failed delivery / return-to-sender / address correction flows | Exceptions | courier | doc | No | exception handling | Each exception handled |
| S7 | Proof of delivery format | Evidence | courier | doc | No | POD storage | POD stored + audited |
| S8 | Rate limits + SLA + support contacts | Ops | courier | doc | No | runbook | Contacts in on-call matrix |

Status: NOT REQUESTED — 2026-09-03.
