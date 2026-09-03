# PCI DSS responsibility matrix (draft)

Design intent: **provider-hosted payment collection** so the platform never handles PAN/CVC/track data, minimising PCI scope (target SAQ A). Final scope depends on the chosen provider (PAY-001) and must be confirmed with WN + the provider + a QSA if required.

| Requirement area | Cardholder data touchpoint | Responsibility | Notes |
|---|---|---|---|
| Card capture | Hosted fields / hosted checkout (provider) | **Provider** | We never render raw card inputs |
| PAN/CVC storage | None | **N/A** | We store only provider references |
| Transmission | Browser ↔ provider (TLS) | **Provider** | Redirect/iframe, not proxied by us |
| Tokenisation / saved authority | Provider vault | **Provider** | We store token/customer reference only |
| Webhook integrity | Signature verification | **Us** | Raw-body verify + idempotency |
| Refunds/credits | Provider API | **Us (initiate)** / Provider (execute) | Step-up + maker-checker + audit |
| Settlement/reconciliation | Provider reports | **Us (reconcile)** | No card data in reports |
| Logging | Redaction of any payment data | **Us** | `logger` redaction enforced |
| Network security / WAF | Edge | **Us/Cloud** | OPS-001 |

## Actions
- Confirm provider + hosted design → determine SAQ level (A vs A-EP).
- Obtain provider's PCI responsibility matrix (PAY-001 P13).
- Ensure no page that renders payment fields includes our scripts that could touch card data (CSP already blocks inline scripts).

Status: DRAFT — pending PAY-001.
