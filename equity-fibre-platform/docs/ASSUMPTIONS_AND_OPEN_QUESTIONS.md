# Assumptions & Open Questions

Working assumptions are encoded in `src/lib/config/business.ts` and can be changed there or (for several) via the admin **Configuration** page. Nothing below should be treated as confirmed business fact.

| ID | Area | Question | Current working assumption | Risk if wrong | Affected components | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 | Eligibility | Exact launch eligibility rules? | Government/community housing + Community Services Card | Wrong approvals/declines | rules engine, config | Wireless Nation | Open |
| Q2 | Eligibility | Accept qualifying-school households? | Defined but **disabled** at launch | Excludes/includes cohort | rules engine, config | WN | Open |
| Q3 | Eligibility | Accept MyMSD letter or only CSC? | Both enabled | Evidence handling | rules engine, config | WN | Open |
| Q4 | Eligibility | How is housing status verified? | Not automated; manual/authorised process | False positives | evidence, provisioning | WN | Open |
| Q5 | Eligibility | How is school eligibility verified? | Not automated | False positives | rules engine | WN | Open |
| Q6 | Eligibility | Does Chorus or WN make the final decision? | WN decides deterministically | Process/authority | rules engine | WN/Chorus | Open |
| Q7 | Eligibility | Does Chorus expose inactivity via API? | Assumed available as site info | Manual checks needed | Chorus adapter | Chorus | Open |
| Q8 | Eligibility | Inactivity = 90 days or 3 calendar months? | 90 days | Edge decisions | rules engine, config | WN/Chorus | Open |
| Q9 | Data | What lead data does Chorus send (contact/addresses/codes/none)? | None; customers apply directly | Privacy/compliance | leads, privacy | WN/Chorus | Open |
| Q10 | Data | What authority/notice governs Chorus→WN data transfer? | Unknown; indirect-collection notice supported | Legal exposure | privacy | Privacy Officer | Open |
| Q11 | Journey | Do customers apply directly to WN? | Yes | Flow design | whole app | WN | Open |
| Q12 | Provisioning | Provision directly through Chorus? | Unknown; generic provider used | Integration rework | provisioning | WN | Open |
| Q13 | Provisioning | Via Feenix/Phoenix or WN platform? | Unknown; generic provider used | Integration rework | provisioning | WN | Open |
| Q14 | Provisioning | Correct spelling/identity of that provider? | Unknown | — | provisioning | WN | Open |
| Q15 | Provisioning | Who owns auth/IP/backhaul/assurance? | Unknown | Ops responsibility | provisioning | WN | Open |
| Q16 | Chorus | Which Chorus API products/versions? | Unknown; endpoints unmapped | Integration | Chorus adapter | Chorus | Open |
| Q17 | Chorus | Sandbox/production credentials? | Not supplied | Blocks live | Chorus adapter | Chorus | **Blocker for live** |
| Q18 | Chorus | Product-offer id for Equity Fibre 100? | Unknown | Ordering | Chorus adapter | Chorus | Open |
| Q19 | Pricing | Is $30 cap GST-inclusive? | Yes (assumed) | Margin/compliance | pricing, config | WN | Open |
| Q20 | Pricing | Weekly/fortnightly billing allowed? | Monthly only | Billing design | billing | WN | Open |
| Q21 | Pricing | True wholesale cost after all charges? | ~$8 + GST | Margin | metrics, config | WN | Open |
| Q22 | Payments | Which payment provider does WN use? | Mock; Stripe scaffold | Integration | payments | WN | Open |
| Q23 | Payments | When to collect upfront modem payment? | BEFORE_SHIPMENT | Cashflow/UX | billing, config | WN | Open |
| Q24 | Modem | How is the $30 Chorus contribution treated? | Deducted from customer price | Margin | pricing, config | WN | Open |
| Q25 | Modem | Customer pays $55/$70/$85/other? | $55 | Revenue/UX | pricing, config | WN | Open |
| Q26 | Modem | Cancel after modem shipped? | Return flow supported; terms TBC | Loss handling | shipping, orders | WN | Open |
| Q27 | Modem | Delivery fails? | Shipment FAILED state supported | Ops | shipping | WN | Open |
| Q28 | Modem | Return/refund policy? | Records supported; policy TBC | Finance | payments, shipping | WN | Open |
| Q29 | Billing | When exactly does monthly billing begin? | SERVICE_ACTIVATION | Revenue/compliance | billing, config | WN | Open |
| Q30 | Billing | Failed-payment grace period? | 14 days | Churn/compliance | billing, config | WN | Open |
| Q31 | Billing | What events lead to suspension? | None auto on single failure | Fairness/compliance | billing, config | WN | Open |
| Q32 | Modem | BYO modem allowed? | Out of scope (recorded) | Scope | modem | WN | Open |
| Q33 | Modem | Exact make/model? | Unknown; generic guide | Support quality | knowledge base | WN | Open |
| Q34 | Modem | Which identifiers go to the network? | MAC + serial stored separately | Provisioning | modem, provisioning | WN/Chorus | Open |
| Q35 | Modem | When is a MAC assigned? | At reservation after payment | Provisioning | modem | WN | Open |
| Q36 | Modem | Who imports modem stock? | Ops (CSV) | Ops | inventory | WN | Open |
| Q37 | Shipping | Which courier? | Mock | Integration | shipping | WN | Open |
| Q38 | Shipping | Courier delivery webhooks available? | Assumed; not integrated | Tracking | shipping | WN | Open |
| Q39 | Support | Support hours / escalation SLA? | Unknown | Ops staffing | support | WN | Open |
| Q40 | Support | What data can offshore support access? | Minimised, PII-restricted | Privacy | rbac, redaction | WN | Open |
| Q41 | Support | Offshore from Myanmar? | Unknown | Privacy/legal | privacy | WN | Open |
| Q42 | Support | Contractual/privacy protections for offshore? | Unknown | Legal | privacy | WN | Open |
| Q43 | Privacy | Who is WN's privacy officer? | Role modelled; person TBC | Accountability | privacy | WN | Open |
| Q44 | Privacy | Approved evidence-retention periods? | 365 days (assumed) | Compliance | evidence, config | WN | Open |
| Q45 | Privacy | Which records retained for finance/contract? | Payment references retained | Compliance | payments | WN | Open |
| Q46 | Legal | Who approves privacy statement & terms? | Unknown | Launch blocker | docs | WN | Open |
| Q47 | Comms | Which email/SMS systems? | Console (mock) | Integration | notifications | WN | Open |
| Q48 | Brand | Brand assets & domain? | Text placeholder | Branding | brand config | WN | Open |
| Q49 | Legal | Who owns the source/platform? | Unknown | Commercial | — | WN | Open |
| Q50 | Ops | Post-launch support/maintenance/incident obligations? | Unknown | Operational | runbook | WN | Open |
