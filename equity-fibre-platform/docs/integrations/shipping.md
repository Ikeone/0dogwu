# Shipping / courier integration

> **Status: MOCKED.** No courier is connected.

## Implemented (demo)
- `MockShippingProvider` (`src/lib/providers/mock/shipping.ts`): creates a shipment with a synthetic tracking reference.
- Shipment state machine: `CREATED → PACKED → SHIPPED → DELIVERED` (plus `FAILED`), progressed from the admin Demo controls, which also advances the linked device state (`src/lib/services/shipping.ts`).
- Delivery does **not** start monthly billing unless `MONTHLY_BILLING_TRIGGER=MODEM_DELIVERY`.

## Interface
`ShippingProvider` (`src/lib/providers/types.ts`): `createShipment`. Delivery/tracking updates are modelled as inbound events (a real courier webhook maps onto `advanceShipment`).

## To implement a real courier
1. Implement `ShippingProvider.createShipment` against the courier API.
2. Add a webhook route mirroring `src/app/api/webhooks/payment/route.ts` (verify signature, dedupe on event id, enqueue processing) that calls `advanceShipment`.
3. Set `SHIPPING_BASE_URL`, `SHIPPING_API_KEY`, `SHIPPING_WEBHOOK_SECRET`; wire into the factory behind `SHIPPING_PROVIDER=courier`.

## Open questions
Q37 (which courier), Q38 (delivery webhooks available?), Q26/Q27 (cancellation after shipment / delivery failure).
