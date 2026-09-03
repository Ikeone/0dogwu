# Payment & billing requirements (BLOCKED_EXTERNAL: PAY-001)

Send to: WN finance owner. Payment provider is undetermined; PAYMENT is MOCK (DEMO). No real money moves.

| # | Exact artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| P1 | Is WN's existing billing system or this platform the financial system of record? | Avoid double-billing | WN finance | doc | No | billing SoR | Boundary documented |
| P2 | Chosen provider (Stripe/Windcave/other) | Adapter | WN | decision | No | `PaymentProvider` adapter | Provider selected |
| P3 | Sandbox + live merchant accounts | Access | WN/provider | account | **Yes** | both | payment adapter | Sandbox charge succeeds |
| P4 | Supported methods: card vs direct debit; recurring authority mechanism | Product | WN/provider | doc | No | subscription flow | Saved authority created |
| P5 | Hosted checkout requirements | PCI scope | provider | doc | No | checkout | Hosted redirect works |
| P6 | Webhook signing secret + event list | Fulfilment | provider | secret | **Yes** | both | webhook verifier | Signed webhook verified + idempotent |
| P7 | Settlement report format + cadence | Reconciliation | provider | schema | No | settlement reconcile | Report parsed + matched |
| P8 | Refund/credit/dispute/chargeback APIs | Finance ops | provider | schema | No | refund UI | Refund + dispute round-trip |
| P9 | GST/tax-invoice requirements | Compliance | WN finance | doc | No | invoice generation | Invoice shows correct GST |
| P10 | Billing cycle + retry/grace/suspension/reconnection policy | Dunning | WN | policy | No | dunning config | Policy encoded + tested |
| P11 | Cancellation + refund policy | Consumer law | WN legal | policy | No | cancellation flow | Policy enforced |
| P12 | Accounting/Xero integration requirements | Finance | WN | doc | No | export | Ledger export matches |
| P13 | PCI DSS responsibility matrix for chosen design | Compliance | WN/provider | doc | No | `docs/PCI_RESPONSIBILITY_MATRIX.md` | Matrix signed |
| P14 | Grant treatment: is NZD 20,000 a startup grant? Is the NZD 30 modem contribution paid/reimbursed/credited, and when? | Subsidy accounting | WN/Chorus finance | agreement | No | Grant/Subsidy models | Config matches agreement |

Default (pending): grant/subsidy timing configurable; no assumption baked in. Status: NOT REQUESTED — 2026-09-03.
