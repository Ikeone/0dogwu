/**
 * Release-readiness gate. Usage: `tsx scripts/readiness.ts pilot|production`.
 *
 * Evaluates the environment against the target mode's fail-closed rules and
 * exits NON-ZERO if any forbidden mode, missing secret, mock provider, SQLite,
 * unapproved rule set, unapproved retention policy, or missing MFA enforcement
 * is detected. This is intentionally strict: with the demo env, the production
 * gate MUST fail. Pure env checks only (no DB), so it can run in CI.
 */
import { evaluateModePolicy, type ModeEnvLike } from "../src/lib/config/mode";

type Target = "pilot" | "production";

const target = (process.argv[2] ?? "").toLowerCase() as Target;
if (target !== "pilot" && target !== "production") {
  console.error("Usage: tsx scripts/readiness.ts <pilot|production>");
  process.exit(2);
}

const env = process.env as ModeEnvLike & Record<string, string | undefined>;
const systemMode = target === "production" ? "PRODUCTION" : "PILOT";

const failures: string[] = [];
const passes: string[] = [];

function check(code: string, ok: boolean, desc: string) {
  (ok ? passes : failures).push(`${ok ? "PASS" : "FAIL"} ${code} ${desc}`);
}

// 1) Provider mode policy (mocks/critical-disabled/etc.)
const policy = evaluateModePolicy({ ...env, SYSTEM_MODE: systemMode });
for (const v of policy.violations) failures.push(`FAIL ${v}`);
check("MODE-000", policy.violations.length === 0, `provider mode policy for ${systemMode}`);

// 2) Secrets are not demo placeholders.
const demoSecret = (v?: string) => !v || v.includes("dev-only-insecure") || v.includes("change-me");
check("SEC-010", !demoSecret(env.AUTH_SECRET), "AUTH_SECRET is a real secret");
check("SEC-011", !demoSecret(env.FIELD_ENCRYPTION_KEY), "FIELD_ENCRYPTION_KEY is a real secret");

// 3) No SQLite in pilot/production.
check("DB-010", !(env.DATABASE_URL ?? "file:").startsWith("file:"), "DATABASE_URL is PostgreSQL (not SQLite)");

// 4) DEMO disabled.
check("MODE-010", (env.DEMO_MODE ?? "true").toLowerCase() !== "true", "DEMO_MODE is false");

// 5) Staff MFA enforced.
check("SEC-020", (env.STAFF_MFA_REQUIRED ?? "").toLowerCase() === "true", "STAFF_MFA_REQUIRED=true");

// 6) Approved, effective eligibility rule set.
check("ELIG-010", (env.ELIGIBILITY_RULESET_STATUS ?? "").toUpperCase() === "APPROVED", "eligibility rule set is APPROVED");

// 7) Approved evidence retention policy (required if evidence is collected).
check("PRIV-010", (env.EVIDENCE_RETENTION_APPROVED ?? "").toLowerCase() === "true", "evidence retention policy is approved");

// 8) Object storage is real (not local disk).
check("SEC-012", (env.STORAGE_MODE ?? "").toUpperCase() === "PRODUCTION" || (env.STORAGE_MODE ?? "").toUpperCase() === "SANDBOX", "object storage is not local disk");

console.log(`\n=== Readiness gate: ${target.toUpperCase()} (SYSTEM_MODE=${systemMode}) ===\n`);
for (const p of passes) console.log("  " + p);
for (const f of failures) console.log("  " + f);
console.log(`\nResult: ${failures.length === 0 ? "PASS" : `FAIL (${failures.length} blocking issue(s))`}\n`);

process.exit(failures.length === 0 ? 0 : 1);
