# Chorus integration request (BLOCKED_EXTERNAL: CHORUS-001)

Send to: Chorus partner onboarding / WN commercial owner. Nothing below is implemented against real Chorus systems; provisioning is MOCK (DEMO) / MANUAL (PILOT).

For each item: exact artifact • why • owner • format • secret? • sandbox/prod • code component blocked • acceptance test.

| # | Exact artifact requested | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| C1 | Chorus Anypoint organisation + user access for Circuit Solutionz as WN's software subcontractor/processor | Access to API portal & specs | Chorus/WN legal | Portal invite | No | both | all Chorus code | Login to Anypoint; see Equity Fibre APIs |
| C2 | Signed API terms accepted by the correct WN legal entity | Legal basis to call APIs | WN legal | PDF ref | No | both | go-live | Terms reference recorded |
| C3 | Sandbox (EMMA) client credentials (client_id/secret) | OAuth token | Chorus | secret values | **Yes** | sandbox | `ChorusClientCredentialsAuth` | Token endpoint returns access_token |
| C4 | Production application-registration requirements | Prod onboarding | Chorus | doc | No | prod | go-live | Registration checklist complete |
| C5 | RAML/OpenAPI files + versions for Place, Product Offering, Order Feasibility, Manage Order, Order Notification, Assurance | Generate transport types | Chorus | RAML/OpenAPI | No | both | `docs/api-specs/chorus/`, `chorus/mapping.ts` | Types generate; contract tests compile |
| C6 | Sandbox + production base URLs | Endpoint routing | Chorus | URLs | No | both | `CHORUS_BASE_URL` | Health/ping reachable |
| C7 | OAuth token URL, grant, scopes, rotation policy | Auth | Chorus | doc | partial | both | `CHORUS_TOKEN_URL/SCOPE` | Scoped token accepted by an API |
| C8 | API key and/or mTLS certificate requirements + cert chain + renewal | Transport security | Chorus | certs/doc | **Yes** | both | `ChorusHttpClient` mTLS | mTLS handshake succeeds in sandbox |
| C9 | IP allow-list requirements | Network access | Chorus | doc | No | prod | infra egress | Calls succeed from allow-listed egress IP |
| C10 | Equity Fibre 100 product-offer ID + order type | Ordering | Chorus | value | No | both | provisioning adapter mapping | Feasibility accepts the product-offer ID |
| C11 | Place/ONT field definitions | Address→Place | Chorus | schema | No | `mapSiteInfo` | Place resolve returns ONT/site state |
| C12 | Definitive inactivity/eligibility result + semantics (90 days vs 3 calendar months) | Authoritative eligibility | Chorus | doc | No | rule set inactivity | Authoritative result drives decision |
| C13 | Feasibility request/response contract | Pre-order check | Chorus | schema | No | provisioning | Feasibility round-trip validates |
| C14 | Order create/amend/cancel/query contract + attachments + Q&A + appointment schema | Manage Order | Chorus | schema | No | provisioning + ops UI | Order lifecycle e2e in sandbox |
| C15 | Notification event list, ordering guarantees, replay rules | Async updates | Chorus | doc | No | notification handler | Replayed event is idempotent |
| C16 | Webhook signing spec (JWT/JWKS/HMAC) + keys | Verify notifications | Chorus | spec + keys | **Yes** | both | webhook verifier | Valid sig accepted; invalid rejected |
| C17 | Rate limits + retry guidance | Reliability | Chorus | doc | No | retry/circuit-breaker | Backoff respects limits |
| C18 | Assurance/network-event/fault APIs | Post-activation | Chorus | schema | No | assurance module | Fault create/query in sandbox |
| C19 | Provider SLA + support contacts | Ops | Chorus | doc | No | runbook | Contacts in on-call matrix |
| C20 | Data retention + reporting obligations | Compliance | Chorus | doc | No | retention config | Retention config matches |
| C21 | Certification test cases required | Go-live gate | Chorus | doc | No | contract test suite | All certification cases pass |

Until C3/C5/C16 are supplied, real webhook mode fails closed (BLOCKED_EXTERNAL) and provisioning runs MANUAL in pilot.

Status: NOT REQUESTED (draft ready to send) — date: 2026-09-03.
