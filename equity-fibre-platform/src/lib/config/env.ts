/**
 * Environment validation and the provider-selection surface.
 *
 * - Validates env vars at startup with Zod.
 * - Server-only. Never import this from a client component.
 * - Production refuses to start with demo secrets or mock money/provisioning.
 */
import { z } from "zod";
import { evaluateModePolicy, type ModeEnvLike } from "./mode";

const DEMO_SECRET_MARKERS = ["dev-only-insecure", "change-me"];

const providerEnum = <T extends [string, ...string[]]>(vals: T, def: T[number]) =>
  z.enum(vals).default(def);

const EnvSchema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  NODE_ENV: z.string().default("development"),
  // Authoritative environment mode (see src/lib/config/mode.ts).
  SYSTEM_MODE: z.enum(["DEMO", "SANDBOX", "PILOT", "PRODUCTION"]).default("DEMO"),
  // Optional per-provider mode overrides (validated by evaluateModePolicy).
  ADDRESS_MODE: z.string().optional(),
  PROVISIONING_MODE: z.string().optional(),
  NETWORK_MODE: z.string().optional(),
  PAYMENT_MODE: z.string().optional(),
  SHIPPING_MODE: z.string().optional(),
  EMAIL_MODE: z.string().optional(),
  SMS_MODE: z.string().optional(),
  AI_MODE: z.string().optional(),
  STORAGE_MODE: z.string().optional(),
  EVIDENCE_VERIFICATION_MODE: z.string().optional(),
  DEMO_MODE: z
    .string()
    .default("true")
    .transform((v) => v.toLowerCase() === "true"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DATABASE_URL: z.string().min(1).default("file:./dev.db"),

  AUTH_SECRET: z.string().min(8).default("dev-only-insecure-change-me"),
  FIELD_ENCRYPTION_KEY: z
    .string()
    .min(8)
    .default("dev-only-insecure-change-me-32byte"),
  SESSION_COOKIE_NAME: z.string().default("wn_session"),

  PAYMENT_PROVIDER: providerEnum(["mock", "stripe"], "mock"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  ADDRESS_PROVIDER: providerEnum(["mock", "chorus"], "mock"),
  PROVISIONING_PROVIDER: providerEnum(["mock", "chorus", "wholesale"], "mock"),
  CHORUS_ENVIRONMENT: providerEnum(["mock", "sandbox", "production"], "mock"),
  CHORUS_BASE_URL: z.string().optional(),
  CHORUS_TOKEN_URL: z.string().optional(),
  CHORUS_CLIENT_ID: z.string().optional(),
  CHORUS_CLIENT_SECRET: z.string().optional(),
  CHORUS_SCOPE: z.string().optional(),
  CHORUS_WEBHOOK_SECRET: z.string().optional(),
  CHORUS_PROVIDER_ACCOUNT_ID: z.string().optional(),

  WHOLESALE_PROVIDER_NAME: z.string().optional(),
  WHOLESALE_PROVIDER_BASE_URL: z.string().optional(),
  WHOLESALE_PROVIDER_API_KEY: z.string().optional(),
  WHOLESALE_PROVIDER_WEBHOOK_SECRET: z.string().optional(),

  SHIPPING_PROVIDER: providerEnum(["mock", "courier"], "mock"),
  SHIPPING_BASE_URL: z.string().optional(),
  SHIPPING_API_KEY: z.string().optional(),
  SHIPPING_WEBHOOK_SECRET: z.string().optional(),

  EMAIL_PROVIDER: providerEnum(["console", "smtp"], "console"),
  EMAIL_FROM: z.string().optional(),
  SMS_PROVIDER: providerEnum(["console", "http"], "console"),

  AI_PROVIDER: providerEnum(["knowledge_base", "anthropic"], "knowledge_base"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),

  OBJECT_STORAGE_PROVIDER: providerEnum(["local", "s3"], "local"),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  AWS_REGION: z.string().default("ap-southeast-6"),

  ERROR_MONITORING_DSN: z.string().optional(),
  CAPTCHA_PROVIDER: providerEnum(["disabled", "turnstile", "recaptcha"], "disabled"),
});

export type Env = z.infer<typeof EnvSchema>;

function usesDemoSecret(value: string): boolean {
  return DEMO_SECRET_MARKERS.some((marker) => value.includes(marker));
}

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;

  // Fail-closed when either APP_ENV or SYSTEM_MODE indicates a locked environment.
  const isProd = env.APP_ENV === "production" || env.SYSTEM_MODE === "PRODUCTION";
  if (isProd) {
    // Production hard stops. See docs/SECURITY.md + docs/ENVIRONMENT_AND_PROVIDER_MODE_MATRIX.md.
    const problems: string[] = [];
    if (env.DEMO_MODE) problems.push("DEMO_MODE must be false in production.");
    if (usesDemoSecret(env.AUTH_SECRET))
      problems.push("AUTH_SECRET is still the demo placeholder.");
    if (usesDemoSecret(env.FIELD_ENCRYPTION_KEY))
      problems.push("FIELD_ENCRYPTION_KEY is still the demo placeholder.");
    if (env.PAYMENT_PROVIDER === "mock")
      problems.push("PAYMENT_PROVIDER=mock is not allowed in production.");
    if (env.PROVISIONING_PROVIDER === "mock")
      problems.push("PROVISIONING_PROVIDER=mock is not allowed in production.");
    if (env.CHORUS_ENVIRONMENT === "mock")
      problems.push("CHORUS_ENVIRONMENT=mock is not allowed in production.");

    // Layer in the full provider mode-policy violations (fail-closed).
    const policy = evaluateModePolicy({ ...(process.env as ModeEnvLike), SYSTEM_MODE: "PRODUCTION" });
    problems.push(...policy.violations);

    if (problems.length > 0) {
      throw new Error(
        "Refusing to start in production:\n" +
          problems.map((p) => `  - ${p}`).join("\n"),
      );
    }
  }

  cached = env;
  return env;
}

/** Provider names for a safe startup log line (NEVER logs credentials). */
export function providerSummary(env: Env): Record<string, string> {
  return {
    appEnv: env.APP_ENV,
    demoMode: String(env.DEMO_MODE),
    payment: env.PAYMENT_PROVIDER,
    address: env.ADDRESS_PROVIDER,
    provisioning: env.PROVISIONING_PROVIDER,
    chorus: env.CHORUS_ENVIRONMENT,
    shipping: env.SHIPPING_PROVIDER,
    email: env.EMAIL_PROVIDER,
    sms: env.SMS_PROVIDER,
    ai: env.AI_PROVIDER,
    storage: env.OBJECT_STORAGE_PROVIDER,
  };
}
