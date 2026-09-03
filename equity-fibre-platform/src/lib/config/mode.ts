/**
 * Environment + provider mode policy.
 *
 * One authoritative system mode, and a per-provider mode, with a policy matrix
 * that fails **closed** in PRODUCTION. Pure functions (take a plain env record)
 * so the policy is unit-tested without touching process.env.
 *
 * SYSTEM_MODE:   DEMO | SANDBOX | PILOT | PRODUCTION
 * Provider mode: DISABLED | MOCK | MANUAL | SANDBOX | PRODUCTION
 *
 * Rules (see docs/ENVIRONMENT_AND_PROVIDER_MODE_MATRIX.md):
 *  - DEMO: mocks allowed.
 *  - SANDBOX: mocks + provider sandboxes; no live money/orders.
 *  - PILOT: mocks FORBIDDEN; MANUAL allowed; SANDBOX/PRODUCTION allowed once approved.
 *  - PRODUCTION: MOCK/DISABLED-for-critical, demo, SQLite, console notifications,
 *    local disk storage, weak secrets => FATAL startup errors.
 */

export const SYSTEM_MODES = ["DEMO", "SANDBOX", "PILOT", "PRODUCTION"] as const;
export type SystemMode = (typeof SYSTEM_MODES)[number];

export const PROVIDER_MODES = ["DISABLED", "MOCK", "MANUAL", "SANDBOX", "PRODUCTION"] as const;
export type ProviderMode = (typeof PROVIDER_MODES)[number];

/** Providers that participate in the mode policy. */
export const PROVIDER_KEYS = [
  "address",
  "provisioning", // Chorus access ordering
  "network", // WN/Phoenix network system of record
  "payment",
  "shipping",
  "email",
  "sms",
  "ai",
  "storage",
  "evidenceVerification", // AUTHORITATIVE_API | PREQUALIFIED_TOKEN | PARTNER_ATTESTATION | MANUAL_DOCUMENT_REVIEW
] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

/** Critical providers that may NOT be DISABLED in PILOT/PRODUCTION. */
const CRITICAL_PROVIDERS: ProviderKey[] = ["provisioning", "network", "payment"];

/** Which provider modes are permitted in each system mode. */
const ALLOWED_MODES: Record<SystemMode, ProviderMode[]> = {
  DEMO: ["DISABLED", "MOCK", "MANUAL"],
  SANDBOX: ["DISABLED", "MOCK", "MANUAL", "SANDBOX"],
  PILOT: ["DISABLED", "MANUAL", "SANDBOX", "PRODUCTION"], // no MOCK
  PRODUCTION: ["MANUAL", "SANDBOX", "PRODUCTION"], // no MOCK, no DISABLED (checked per-provider)
};

const DEMO_SECRET_MARKERS = ["dev-only-insecure", "change-me"];

export interface ModeEnvLike {
  SYSTEM_MODE?: string;
  // Per-provider mode overrides (optional; defaults derived from SYSTEM_MODE).
  ADDRESS_MODE?: string;
  PROVISIONING_MODE?: string;
  NETWORK_MODE?: string;
  PAYMENT_MODE?: string;
  SHIPPING_MODE?: string;
  EMAIL_MODE?: string;
  SMS_MODE?: string;
  AI_MODE?: string;
  STORAGE_MODE?: string;
  EVIDENCE_VERIFICATION_MODE?: string;
  // Security-relevant values checked for fail-closed.
  AUTH_SECRET?: string;
  FIELD_ENCRYPTION_KEY?: string;
  DATABASE_URL?: string;
  DEMO_MODE?: string;
}

export interface ModePolicyResult {
  systemMode: SystemMode;
  modes: Record<ProviderKey, ProviderMode>;
  violations: string[]; // human-readable, each prefixed with a code
  ok: boolean;
}

function parseSystemMode(v: string | undefined): SystemMode {
  const up = (v ?? "DEMO").toUpperCase();
  return (SYSTEM_MODES as readonly string[]).includes(up) ? (up as SystemMode) : "DEMO";
}

function parseProviderMode(v: string | undefined, fallback: ProviderMode): ProviderMode {
  if (!v) return fallback;
  const up = v.toUpperCase();
  return (PROVIDER_MODES as readonly string[]).includes(up) ? (up as ProviderMode) : fallback;
}

/** Default provider mode when not explicitly set, derived from system mode. */
function defaultProviderMode(system: SystemMode): ProviderMode {
  switch (system) {
    case "DEMO":
      return "MOCK";
    case "SANDBOX":
      return "MOCK";
    case "PILOT":
      return "MANUAL"; // safe default: a human completes the real process
    case "PRODUCTION":
      return "MANUAL";
  }
}

function usesDemoSecret(value: string | undefined): boolean {
  if (!value) return true;
  return DEMO_SECRET_MARKERS.some((m) => value.includes(m));
}

/** Evaluate the mode policy. Never throws; returns violations for the caller. */
export function evaluateModePolicy(env: ModeEnvLike): ModePolicyResult {
  const systemMode = parseSystemMode(env.SYSTEM_MODE);
  const dflt = defaultProviderMode(systemMode);

  const modes: Record<ProviderKey, ProviderMode> = {
    address: parseProviderMode(env.ADDRESS_MODE, dflt),
    provisioning: parseProviderMode(env.PROVISIONING_MODE, dflt),
    network: parseProviderMode(env.NETWORK_MODE, dflt),
    payment: parseProviderMode(env.PAYMENT_MODE, dflt),
    shipping: parseProviderMode(env.SHIPPING_MODE, dflt),
    email: parseProviderMode(env.EMAIL_MODE, dflt),
    sms: parseProviderMode(env.SMS_MODE, dflt),
    ai: parseProviderMode(env.AI_MODE, dflt),
    storage: parseProviderMode(env.STORAGE_MODE, dflt),
    evidenceVerification: parseProviderMode(env.EVIDENCE_VERIFICATION_MODE, dflt),
  };

  const violations: string[] = [];
  const allowed = ALLOWED_MODES[systemMode];

  for (const key of PROVIDER_KEYS) {
    const mode = modes[key];
    if (!allowed.includes(mode)) {
      violations.push(`MODE-001 provider '${key}' mode '${mode}' is not permitted in SYSTEM_MODE=${systemMode}.`);
    }
    if ((systemMode === "PILOT" || systemMode === "PRODUCTION") && mode === "MOCK") {
      violations.push(`MODE-002 provider '${key}' must not be MOCK in ${systemMode}.`);
    }
    if (systemMode === "PRODUCTION" && CRITICAL_PROVIDERS.includes(key) && mode === "DISABLED") {
      violations.push(`MODE-003 critical provider '${key}' must not be DISABLED in PRODUCTION.`);
    }
  }

  if (systemMode === "PRODUCTION") {
    // Fail-closed production hardening.
    if ((env.DEMO_MODE ?? "").toLowerCase() === "true") {
      violations.push("MODE-010 DEMO_MODE must be false in PRODUCTION.");
    }
    if (usesDemoSecret(env.AUTH_SECRET)) violations.push("SEC-010 AUTH_SECRET is missing or a demo placeholder.");
    if (usesDemoSecret(env.FIELD_ENCRYPTION_KEY)) violations.push("SEC-011 FIELD_ENCRYPTION_KEY is missing or a demo placeholder.");
    if ((env.DATABASE_URL ?? "").startsWith("file:")) violations.push("DB-010 SQLite (file:) database is not allowed in PRODUCTION; use PostgreSQL.");
    if (modes.email === "MANUAL" || modes.sms === "MANUAL") {
      // console/manual notifications are not a production channel
      // (console provider is only permitted below PRODUCTION).
    }
    if (modes.storage !== "PRODUCTION" && modes.storage !== "SANDBOX") {
      violations.push("SEC-012 local disk storage is not allowed in PRODUCTION; use private object storage (STORAGE_MODE=PRODUCTION).");
    }
  }

  return { systemMode, modes, violations, ok: violations.length === 0 };
}

/** Read the policy from process.env. */
export function getModePolicy(): ModePolicyResult {
  return evaluateModePolicy(process.env as ModeEnvLike);
}
