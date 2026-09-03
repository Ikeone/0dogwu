# Payment integration

> **Status: MOCK provider fully working; Stripe adapter is a documented scaffold.** No real money moves. No card data is ever collected or stored.

## Implemented (demo)
- `MockPaymentProvider` (`src/lib/providers/mock/payment.ts`): simulated hosted checkout (in-app route), HMAC-signed webhooks (so signature verification + idempotency are exercised exactly like a real provider).
- Webhook handling with **double idempotency** (`WebhookEvent` unique + `PaymentEvent.externalId` unique) so a duplicate delivery never double-charges or double-transitions (`src/lib/services/payments.ts`).
- Flows: successful/failed/abandoned modem payment, duplicate webhook, subscription creation, monthly success/failure, grace period, recovery, refund.

## Interface
`PaymentProvider` (`src/lib/providers/types.ts`): `createCheckout`, `parseWebhook`. Fulfilment is **webhook-driven** — never from the browser redirect alone.

## Replacing with Stripe (or WN's provider)
1. Implement `StripePaymentProvider`:
   - `createCheckout` → create a Stripe Checkout Session (hosted) or PaymentIntent + hosted components; return the redirect URL. Create the customer + payment-method references server-side.
   - `parseWebhook` → verify `stripe-signature` against the **raw** body using `STRIPE_WEBHOOK_SECRET`; map events to `{ externalEventId, transactionRef, outcome }`.
2. Wire it into `src/lib/providers/factory.ts` behind `PAYMENT_PROVIDER=stripe`.
3. Set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (server-side only).
4. Recurring billing: create a Stripe Subscription (or off-session PaymentIntents) started from the configured business event (`MONTHLY_BILLING_TRIGGER`).

## Rules
- Never build raw card fields; use hosted collection only.
- Store provider references only — never PAN/CVC/track data.
- Store each external event id exactly once; make fulfilment idempotent.
- Put uncertain cases into an operations queue; refunds/account changes require an authorised finance action and are audited.
- Do not auto-suspend on a single failed payment unless a reviewed policy enables it (`billing.suspendOnSingleFailure`, default false).

## Open questions
Q22 (which provider), Q23 (when to collect upfront), Q28 (refund policy), Q29 (billing start), Q30 (grace period), Q31 (suspension events).
