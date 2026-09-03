# Go-live checklist (release gates)

No AI agent can waive these gates.

## Gate A — Production candidate (internal)
- [x] Internal workflows implemented (eligibility, orders, modem, billing, support, admin)
- [x] Fail-closed production modes (mocks/secrets/SQLite/storage) + readiness gate
- [x] Staff MFA + recovery + step-up + maker-checker (libraries verified)
- [x] Nonce CSP + core security headers
- [x] Kill switches (registry + core enforcement)
- [x] Reconciliation + worker lease recovery
- [x] Versioned eligibility rule set
- [ ] PostgreSQL migrations + concurrency verified on Postgres (INYV — needs Docker/psql)
- [ ] Full security/E2E suites executed in CI (INYV)
- [ ] Staging-shaped deployment + smoke (blocked on OPS-001)
- [x] No real provider represented by a mock; external blockers exact & visible
→ **Gate A: NOT PASSED** (internal INYV items remain; see status).

## Gate B — Controlled pilot
- [ ] WN/Chorus approve pilot scope
- [ ] Real test/live-limited provider credentials exist (CHORUS/PAY/COUR/COMM)
- [ ] Contract tests pass in sandbox
- [ ] Real payment authority approved
- [ ] Real network activation verified (NET-001)
- [ ] Approved eligibility/manual verification process (MSD/HOUSE)
- [ ] PIA + customer documents approved (LEGAL-001)
- [ ] Staff MFA/on-call/support operational
- [ ] Backup restore + incident exercise pass
- [ ] Independent security findings remediated or formally accepted
- [ ] Kill switches + rollback tested
→ **Gate B: NO-GO**.

## Gate C — General production launch
- [ ] Every critical external integration production-verified (CHORUS/NET/PAY)
- [ ] Chorus/WN commercial + technical approval complete
- [ ] Contact rights for any household list confirmed
- [ ] Privacy/data-sharing/overseas-processing contracts signed
- [ ] Payment/PCI responsibility approved
- [ ] Formal PIA + legal documents signed off
- [ ] Penetration test complete; critical/high closed or accepted
- [ ] Operational owner, SLA, incident response, support, DR funded & assigned
- [ ] Production monitoring proves stable operation through the agreed pilot period
→ **Gate C: NO-GO**.
