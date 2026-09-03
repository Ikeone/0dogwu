# Privacy, legal & contract requirements (BLOCKED_EXTERNAL: LEGAL-001)

Send to: WN privacy officer + legal. Software implements controls; humans must approve policy and contracts.

| # | Exact artifact | Why | Owner | Format | Secret? | Env | Code blocked | Acceptance test |
|---|---|---|---|---|---|---|---|---|
| L1 | Named privacy officer (accountable person) | Accountability | WN | name/role | No | privacy workflow | Officer recorded |
| L2 | Approved Privacy Impact Assessment sign-off | Launch gate | WN privacy | signed doc | No | PIA doc | PIA status = APPROVED |
| L3 | Approved privacy notice + consent wording (service vs marketing) | IPP compliance | WN legal | copy | No | consent versions | Notices referenced in-app |
| L4 | Approved customer terms, AUP, cancellation/refund, complaints, support policies | Consumer law | WN legal | docs | No | policy pages | Policies published (not DRAFT) |
| L5 | Data-sharing agreement basis for any Chorus/referral/lead data (IPP3A) | Indirect collection | WN legal | agreement | No | lead import + IPP3A notice | Import blocked without basis |
| L6 | Approved evidence-retention schedule + financial-record retention | Retention job | WN legal | schedule | No | retention config | Retention job enabled only after |
| L7 | Overseas-processing + subprocessor DPAs (hosting, AI, payment, SMS/email, offshore support) | Cross-border | WN legal | contracts | No | subprocessor register | Register complete + signed |
| L8 | Contact/notification authority for any household list | Anti-spam | WN legal | doc | No | acquisition | No contact without authority |
| L9 | Telecommunications Dispute Resolution enrolment | Consumer redress | WN | membership | No | complaints policy | TDR route published |
| L10 | 111 Contact Code applicability (only if voice service) | Safety | WN legal | assessment | No | N/A for naked broadband | Documented decision |
| L11 | PCI DSS scope confirmation with hosted payment design | Payments | WN/provider | doc | No | PCI matrix | Matrix signed |

Launch remains NO-GO until L2, L4, L5, L7 are complete. Status: NOT REQUESTED — 2026-09-03.
