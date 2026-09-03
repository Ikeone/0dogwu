# Production readiness brief (for Tom / WN leadership)

Plain-English summary. No jargon, no overclaiming.

## Where we are
We took the working prototype and hardened it toward production. The app now has real safety controls: it **refuses to run in "production" mode with demo settings**, it **never silently pretends** a real integration is connected, and high-risk actions (refunds, rule changes) require re-authentication and a **second approver**. Staff can use **two-factor authentication**. Eligibility rules are now **versioned and configurable** (not hard-coded), and outages route to human review instead of guessing.

## What is genuinely done and tested
- Environment safety modes with fail-closed production checks (demonstrated: the production readiness check **fails** on the current demo settings and **passes** only when everything is properly configured).
- Staff 2FA (authenticator app) + backup codes; step-up re-auth for sensitive actions; two-person approval for high-risk changes.
- Versioned eligibility rules (housing OR school-equity ≥ 490; Community Services Card OR MyMSD letter; fibre installed AND inactive), with four verification paths and "never auto-approve a government document by OCR/AI".
- Stronger web security (nonce-based content security policy), kill switches to pause any risky workflow, and automatic recovery/reconciliation for background jobs.
- Automated tests grew from 48 to **80**, all passing; the code builds cleanly.

## What is NOT done (and why)
- **Real connections to Chorus, the payment provider, the courier, email/SMS, and the network system are not built** because we don't yet have their API specs, credentials, or commercial rules. We've written exact request lists (`docs/external-requests/`) so these can be obtained.
- **PostgreSQL** (the production database) is prepared but not runtime-verified here (this build machine has no database engine). It needs a normal cloud/Docker environment to finish.
- **Legal/privacy sign-off**, an **independent security test**, and **cloud/secret-manager setup** are outside software and must be completed by WN.

## Honest status against the three gates
- **Production candidate (internal):** substantially advanced but **not fully passed** — a few internal checks need a real database environment.
- **Controlled pilot:** **not yet** — needs approved provider test credentials and legal sign-off.
- **General production launch:** **not yet (NO-GO)** — needs the live integrations, contracts, privacy sign-off, and a passed penetration test.

## What you can safely show today
The full journey end-to-end on synthetic data (eligibility → payment → modem → provisioning → activation → billing → support), plus the new production safety controls (readiness gate failing/passing, 2FA, approvals, kill switches).

## What we need from you (top items)
Chorus API access + credentials; the payment provider decision; the network system details (Phoenix/Feenix/internal); the modem model + manual; a privacy officer + PIA sign-off; and a cloud account + region. See `docs/EXTERNAL_BLOCKERS.md`.
