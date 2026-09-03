# Demo script (8–12 minutes)

A concise, impressive walkthrough for the CEO. All data is synthetic; every screen shows the DEMO banner.

## Setup (before the room)
```bash
cd equity-fibre-platform
npm install
npm run db:reset      # seeds scenarios A–G
npm run dev           # http://localhost:3000
```
Open two browser profiles/tabs if you want customer + staff side by side.

## Demo accounts
- Staff: `admin@wn.demo` (Super Admin), `ops@wn.demo`, `support@wn.demo`, `finance@wn.demo`, `privacy@wn.demo`. One-click on `/login`.
- Customers: `aroha.customer@demo.nz` (active), `grace.customer@demo.nz` (grace period), `finn.customer@demo.nz` (retry). Password for all: `demo1234`.

## Script

1. **Landing page & offer** (`/`). Point out: 100/20 Mbps, up to $30/mo (GST-inclusive assumption), upfront modem contribution, eligibility conditions, privacy reassurance. Not "free".

2. **Address & eligibility check** (**Check your eligibility**). Search `rimu`; pick a "(likely eligible)" address → green availability result (ONT present, inactive 210 days).

3. **Eligible application**. Household = Public/community housing; evidence = Community Services Card; enter contact details.

4. **Privacy & evidence**. Show separate required vs optional (marketing) consent, no pre-ticked boxes. Upload any small PNG/JPEG/PDF as evidence (or skip to show the "needs information" path). Review → **Submit**.

5. **Result**. Deterministic decision with per-rule reasons. (With evidence uploaded → **eligible** → "Continue to modem payment".)

6. **Upfront modem contribution** (checkout). Show the itemised $70 + $15 − $30 = **$55** and "Pay successfully (simulate)". No card fields. → lands in the customer portal.

7. **Admin dashboard** (`/login` → Super Admin). Applications, eligibility success, manual-review count, stock, active services, estimated MRR/contribution, automation load.

8. **Automatic eligibility result & manual review**. Applications → filter **manual review** → open Scenario D (PROVIDER_CONFLICT) → show rule results + approve/decline (reason is audited).

9. **Modem MAC assignment**. Modem inventory → show devices, WAN MACs, statuses; note single-use assignment + MAC validation. (Optional: CSV import a new device.)

10. **Provisioning queue + transient failure & automatic retry**. Provisioning → Integration jobs → show a job with **attempts 2/5, retryable_error → success** (Scenario F). This is a real durable-job retry.

11. **Demo controls — drive the lifecycle**. Demo controls → pick Scenario E or F → **Payment successful** (if needed) → **Run provisioning queue** → **Modem packed → shipped → delivered** → **Service activated**. Watch the status pills update live.

12. **Service activation & monthly billing**. Activating starts the monthly subscription (default trigger = activation, not delivery).

13. **Customer portal** (`aroha.customer@demo.nz`). Progress timeline (all green), modem card, billing status + next payment date, messages, privacy & data requests.

14. **AI-guided modem setup** (`/support`). Ask "How do I connect my modem to the ONT?" → grounded answer **with cited articles**.

15. **Human escalation**. Ask "there is smoke and sparks from the modem" → immediate escalation + support ticket. Show it in Admin → Support (privacy-safe view, take over/resolve).

16. **Audit history** (`/admin/audit`). Append-only trail: logins, eligibility decisions, modem assignment, provisioning, activation, config changes.

17. **Metrics / low manual intervention** (`/admin/metrics`). Per-customer contribution estimate, escalations per 100 applications, manual reviews outstanding — the automation story.

18. **Configuration without code** (`/admin/config`). Change e.g. grace period or billing trigger (reason required, audited).

19. **Integration settings** — explain mock vs real providers (see `docs/INTEGRATIONS.md`): everything external is mocked and swappable per package.

20. **Live Chorus path** — show `docs/integrations/chorus.md`: exactly what's needed (API spec, credentials, product-offer id) to go live.

## Closing line
"Everything you've seen runs today on synthetic data with safe mock integrations. To connect the real Chorus, payment and courier systems, we need the specific items listed in the docs — the platform is built to drop those in without changing the rest."
