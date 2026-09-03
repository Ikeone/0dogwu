# Provisioning integration

> **Status: MOCKED.** The provisioning topology is an open question (Q12–Q15): directly with Chorus, via Feenix/Phoenix, or a Wireless Nation platform. The app is intentionally decoupled from any single assumption.

## Design
- Generic `ProvisioningProvider` interface (`src/lib/providers/types.ts`): `createOrder`, `getOrderStatus`.
- Selected by `PROVISIONING_PROVIDER` via the factory (`mock` today; `chorus` / `wholesale` throw a clear "not implemented" error rather than falling back to mock).
- Provisioning runs as **durable integration jobs** (`src/lib/services/provisioning.ts`), never as fragile inline HTTP from a UI handler:
  - correlation ids + idempotency keys,
  - retry classification + exponential backoff with jitter,
  - dead-letter state + manual retry,
  - full attempt log (visible in the admin Provisioning page).

## Device identifiers
The app stores the WAN MAC **and** serial number separately (`ExternalOrderReference`) because it is not yet known which identifier the network platform requires (Q34). The provider adapter decides which to send. A MAC is assigned at reservation after payment (Q35) — this is configurable in the adapter.

## To implement a real adapter
1. Implement the `ProvisioningProvider` interface in a new adapter package.
2. Map the order-create/query/amend/cancel and notification payloads in that adapter only.
3. Wire it into `src/lib/providers/factory.ts`.
4. Provide credentials via `WHOLESALE_PROVIDER_*` or the Chorus vars, as appropriate.
5. Confirm the wholesale provider identity/spelling (Q14) and ownership of auth/IP/backhaul/assurance (Q15).

## Wholesale uncertainty
`WHOLESALE_PROVIDER_NAME`, `WHOLESALE_PROVIDER_BASE_URL`, `WHOLESALE_PROVIDER_API_KEY`, `WHOLESALE_PROVIDER_WEBHOOK_SECRET` exist so a Feenix/Phoenix/WN adapter can be added without touching the domain layer.
