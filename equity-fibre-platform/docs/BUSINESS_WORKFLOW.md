# Business workflow

## Customer journey
1. **Learn** — landing page explains the plan, price (up to $30/mo, GST-inclusive working assumption), eligibility conditions, and the upfront modem contribution. Never described as free.
2. **Check address** — synthetic address search returns ONT presence + inactivity.
3. **Eligibility assessment** — multi-step wizard: household category → evidence type → contact details.
4. **Evidence** — private, encrypted upload (PNG/JPEG/PDF, ≤8 MB), completeness only (authenticity handled by an authorised process).
5. **Account/consent** — separate required service consent vs optional marketing; timestamps + policy version; no pre-ticked boxes.
6. **Decision** — deterministic rules engine → ELIGIBLE / INELIGIBLE / NEEDS_INFORMATION / MANUAL_REVIEW, with per-rule reasons shown.
7. **Upfront modem payment** — simulated hosted checkout; fulfilment is webhook-driven and idempotent.
8. **Modem assignment** — an available modem is reserved atomically; MAC + serial attached to the order.
9. **Provisioning** — a durable job creates the provider order (with retry on transient failure).
10. **Shipment** — packed → shipped → delivered; customer tracks status.
11. **Activation** — service goes ACTIVE.
12. **Billing** — monthly subscription starts at the configured event (default: activation, not delivery). Failed payment → grace period, not immediate disconnection.
13. **Support** — AI assistant answers setup/eligibility/billing questions from approved knowledge; escalates to a human when needed.

## Staff journey
- **Dashboard** — applications, eligibility success rate, manual-review count, provisioning exceptions, stock, failed payments, active services, estimated MRR/contribution, automation load.
- **Applications** — search/filter; review rule results; time-limited evidence access; approve/decline/request-info with an audited reason. Manual review only when genuinely needed.
- **Provisioning** — pending orders, integration attempts, correlation/idempotency ids, retry, manual review.
- **Inventory** — individual + CSV import; MAC validation/normalisation; duplicate detection; single-use assignment; life-long traceability.
- **Payments** — provider-reference-only transactions; refunds (finance-only, audited); failed-payment visibility.
- **Support** — escalated tickets, privacy-safe AI interaction view, take over/resolve, knowledge-base editor with review flags.
- **Configuration** — change business rules without code (audited); secrets never shown.
- **Metrics** — unit economics estimates; automation and load indicators.
- **Audit** — append-only history of significant events.

## Configurable business events
- `MODEM_PAYMENT_TRIGGER`: BEFORE_SHIPMENT (default) | ON_SHIPMENT | ON_DELIVERY.
- `MONTHLY_BILLING_TRIGGER`: SERVICE_ACTIVATION (default) | MODEM_DELIVERY | MANUAL_APPROVAL.
Modem payment and monthly billing are kept as **separate** business events.
