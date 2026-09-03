# Chorus integration

> **Status: MOCKED.** No real Chorus endpoints, product identifiers, authentication details or payloads are implemented. This document is the single place a future engineer completes the integration from the official Chorus API specification.

## What is implemented (demo)
- `MockAddressProvider` (`src/lib/providers/mock/address.ts`): deterministic synthetic address search + site/ONT info (ONT presence, days-since-active).
- `MockProvisioningProvider` (`src/lib/providers/mock/provisioning.ts`): deterministic order creation + status; transient-failure simulation for retry demos.
- Domain-facing interfaces (`src/lib/providers/types.ts`): `AddressProvider`, `ProvisioningProvider` describing the capabilities the app needs.
- A real HTTP client **scaffold** with OAuth2 client-credentials auth, correlation-id/idempotency headers, timeout, and payload-safe logging (`src/lib/providers/chorus/client.ts`).
- A DTO **mapping seam** (`src/lib/providers/chorus/mapping.ts`).

## What is simulated (NOT live)
Address search, site/ONT lookup, availability, product offers, order feasibility/create/query/amend/cancel, order notifications, service status, assurance/line checks. All values are synthetic and deterministic.

## API documentation still required (open questions)
- Which Chorus API products and versions Wireless Nation will use (Q16).
- The exact endpoint paths, request/response DTOs, and error model (Q16).
- The product-offer identifier for Equity Fibre 100 (Q18).
- Whether Chorus exposes the three-month inactivity result via API (Q7) and whether it is 90 days or 3 calendar months (Q8).
- Whether Chorus or Wireless Nation makes the final eligibility decision (Q6).

## Credentials required (not in repo)
`CHORUS_BASE_URL`, `CHORUS_TOKEN_URL`, `CHORUS_CLIENT_ID`, `CHORUS_CLIENT_SECRET`, `CHORUS_SCOPE`, `CHORUS_WEBHOOK_SECRET`, `CHORUS_PROVIDER_ACCOUNT_ID`. These are server-side only; never sent to the browser; never committed.

## Where endpoint mappings belong
- Endpoint paths: `CHORUS_ENDPOINTS` in `src/lib/providers/chorus/client.ts` (currently empty — do not invent).
- Provider→domain DTO mapping: `src/lib/providers/chorus/mapping.ts` (`mapAddressSearch`, `mapSiteInfo`, plus order/status mappers to add).
- A new `ChorusAddressProvider` / `ChorusProvisioningProvider` implementing the domain interfaces; wire them into `src/lib/providers/factory.ts` behind `ADDRESS_PROVIDER=chorus` / `PROVISIONING_PROVIDER=chorus`.

## Where product-offer identifiers belong
In the provisioning adapter mapping (map the internal `planCode` `EQUITY_FIBRE_100` to the Chorus product-offer id). Keep it out of the domain layer.

## Sandbox vs production
Selected by `CHORUS_ENVIRONMENT` (`mock` | `sandbox` | `production`) plus the corresponding base/token URLs and credentials. Production refuses to start while `CHORUS_ENVIRONMENT=mock` (see `src/lib/config/env.ts`).

## Webhooks / notifications
- Verify the provider signature using `CHORUS_WEBHOOK_SECRET` against the **raw** request body (see the payment webhook route for the pattern: `src/app/api/webhooks/payment/route.ts`).
- Store each provider event id exactly once (`WebhookEvent` unique on `(provider, externalId)`), and make processing idempotent.
- Respond quickly; enqueue longer processing as an `IntegrationJob`.

## Idempotency
- Outbound: send an idempotency key on order creation (`CreateOrderInput.idempotencyKey`; the client sends an `idempotency-key` header).
- Inbound: dedupe on the provider event id.

## Retryable vs permanent errors
Classified by `src/lib/domain/retry.ts`: 5xx/408/429/transport → retryable (exponential backoff with jitter, capped by `maxAttempts`); 4xx (except 408/429) and validation errors → permanent (dead-letter, no infinite retries).

## Preventing payload leakage in logs
The client logs only method + endpoint key + correlation id — never the body. All structured logs pass through `redactObject` (`src/lib/logger.ts`). Do not add raw provider payloads to logs.
