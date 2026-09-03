# Privacy Impact Assessment (DRAFT)

> Draft only. Not legal advice and not a completed PIA. Must be reviewed and approved by Wireless Nation's privacy officer and legal advisers (Q43, Q46). Framed against the NZ Privacy Act 2020 Information Privacy Principles (IPPs).

## 1. Overview
The platform collects personal and sensitive information (contact details, address, household category, low-income evidence such as a Community Services Card or MSD letter, payment references) to assess eligibility for and deliver the Equity Fibre service.

## 2. Information flows
See `DATA_MAP.md`. Customers apply directly (working assumption Q11). If Chorus supplies household data instead (Q9), an **indirect-collection notice** flow is available (`IndirectCollectionNotice`/`Lead` records capture source, date, legal basis, notification status, suppression).

## 3. IPP assessment (summary)
- **IPP1–4 (collection):** Data minimisation enforced (only what's needed; separate optional marketing consent; no pre-ticked boxes). Collection notices shown in the wizard. Sensitive evidence collected only for eligibility. **Gap:** approved wording/legal basis (Q46, Q10).
- **IPP5 (storage & security):** Encryption at rest for evidence, private storage, RBAC, audit, redacted logs. **Gaps:** MFA, malware scanning, KMS, managed DB (see `SECURITY_LIMITATIONS.md`).
- **IPP6 (access) / IPP7 (correction):** Self-service access/correction/deletion requests in the portal (`/portal/privacy`), recorded and routed to the privacy officer.
- **IPP8 (accuracy):** Deterministic rules with clear reasons; manual review for conflicts.
- **IPP9 (retention):** Configurable retention + automated deletion job with dry-run. **Gap:** approved periods (Q44) and financial-record retention (Q45).
- **IPP10 (use limitation):** Purpose-bound; evidence never sent to AI; internal cost data never shown to customers.
- **IPP11 (disclosure):** Disclosures limited to providers necessary for the service; recorded. **Gap:** overseas disclosure controls (see `OVERSEAS_ACCESS_AND_PROCESSING.md`).
- **IPP12 (unique identifiers):** No unnecessary government identifiers stored; card/entitlement numbers not retained beyond need.

## 4. Key risks & recommendations
1. Sensitive evidence handling → onshore-approved storage, malware scanning, strict access + retention. 
2. Offshore support access → contractual + technical minimisation, location decision (Q40–Q42).
3. Indirect collection from Chorus → do not assume consent to market to supplied households; issue notices (Q9, Q10).
4. Legal approval of privacy statement, consent wording, and customer terms (Q46).

## 5. Sign-off (to complete)
Privacy Officer: ____  Legal: ____  Date: ____
