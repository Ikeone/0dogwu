# Integrations overview

All external systems are behind typed **domain interfaces** (`src/lib/providers/types.ts`) chosen by a **provider factory** (`src/lib/providers/factory.ts`) from validated env config. In demo mode everything resolves to deterministic mocks; in integration mode, unimplemented adapters throw a clear error and **never silently fall back to mock**.

| Domain interface | Env selector | Demo adapter | Real adapter status | Doc |
| --- | --- | --- | --- | --- |
| `AddressProvider` | `ADDRESS_PROVIDER` | mock | Chorus: scaffold | `integrations/chorus.md` |
| `ProvisioningProvider` | `PROVISIONING_PROVIDER` | mock | Chorus/wholesale: scaffold | `integrations/provisioning.md` |
| `PaymentProvider` | `PAYMENT_PROVIDER` | mock (full) | Stripe: scaffold | `integrations/payment.md` |
| `ShippingProvider` | `SHIPPING_PROVIDER` | mock | courier: TODO | `integrations/shipping.md` |
| Email / SMS | `EMAIL_PROVIDER` / `SMS_PROVIDER` | console | SMTP/HTTP: TODO | — |
| `ObjectStorageProvider` | `OBJECT_STORAGE_PROVIDER` | local (encrypted) | S3: TODO | — |
| `SupportAIProvider` | `AI_PROVIDER` | knowledge_base (full) | Anthropic: scaffold | `integrations/ai.md` |

## Replacement recipe (applies to each)
1. Implement the domain interface in a new adapter, mapping provider DTOs to domain types **inside that adapter only**.
2. Wire it into the factory behind the env selector.
3. Provide credentials via the documented env vars (server-side only; never committed).
4. For inbound events, add a webhook route that verifies the signature against the raw body, dedupes on the provider event id, and enqueues processing.

See `docs/REAL_INTEGRATION_CHECKLIST.md` for the go-live checklist.
