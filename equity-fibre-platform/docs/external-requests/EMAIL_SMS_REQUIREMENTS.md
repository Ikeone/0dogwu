# Email & SMS requirements (BLOCKED_EXTERNAL: COMM-001)

Send to: WN comms owner. Email/SMS are console/MOCK; Mailpit is used locally. No real messages are sent.

| # | Exact artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| E1 | Chosen email provider (SES/SendGrid/other) | Adapter | WN | decision | No | `NotificationProvider(email)` | Provider selected |
| E2 | Chosen SMS provider | Adapter | WN | decision | No | SMS provider | Provider selected |
| E3 | Sandbox + production credentials | Access | provider | secret | **Yes** | both | notification adapters | Sandbox send succeeds |
| E4 | Verified sending domain + DKIM/SPF/DMARC | Deliverability | WN/provider | DNS | partial | outbox | Domain verified |
| E5 | Bounce/complaint/delivery webhooks | Suppression | provider | schema | partial | suppression handling | Bounce suppresses recipient |
| E6 | Sender identity + unsubscribe requirements (Unsolicited Electronic Messages Act) | Compliance | WN legal | doc | No | templates | Unsubscribe present on marketing |
| E7 | Approved template copy per event | Product | WN | copy | No | versioned templates | Templates approved + versioned |
| E8 | Rate limits + throughput | Reliability | provider | doc | No | outbox pacing | Batch respects limits |

Rule: no sensitive eligibility/payment info in subjects or SMS bodies. Status: NOT REQUESTED — 2026-09-03.
