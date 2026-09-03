# Overseas access and processing

> Draft. Requires legal review and Wireless Nation decisions (Q40–Q42, Q41 offshore location, Q10 Chorus data authority).

## Why this matters
Some processing and support may occur outside New Zealand (e.g. an offshore operations worker, or external providers like an AI provider or cloud region). Under the NZ Privacy Act 2020 (IPP12 and cross-border disclosure rules), sending or exposing personal information overseas carries obligations.

## Current design controls
- **Offshore role minimisation:** the `offshore@wn.demo` account is `READ_ONLY` with a PII-restricted view; customer messages shown to support are redacted (`redactText`). Evidence access is limited to Privacy/Ops and is audited.
- **Evidence stays out of AI/overseas by default:** eligibility documents are never sent to an AI provider; the AI assistant receives only approved knowledge + the question.
- **Provider region config:** `AWS_REGION` (default `ap-southeast-6` placeholder) and provider selection allow choosing NZ/AU regions where available.
- **Audit of staff access** to sensitive records.

## Decisions & controls still required
| Item | Question | Needed control |
| --- | --- | --- |
| Offshore support location | Q41 (Myanmar?) | Confirm country; assess adequacy; contractual clauses |
| Offshore data scope | Q40 | Define exactly which fields are visible; enforce via role + redaction |
| Offshore contracts | Q42 | Binding privacy/security terms, access logging, breach obligations |
| Chorus data transfers | Q9/Q10 | Legal basis + notice for any indirectly-supplied household data |
| AI provider region/terms | — | If Anthropic enabled, confirm data-handling terms; keep sensitive data out |
| Cloud region | — | Prefer NZ/AU-hosted managed DB + private storage |

## Recommendation
Default to **NZ-hosted** infrastructure for personal data at rest, minimise what any overseas party can see, and gate any overseas access behind contracts + technical redaction. Do not expose eligibility evidence overseas without explicit approval.
