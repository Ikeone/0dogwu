/**
 * PII redaction helpers for logs, AI context, and privacy-safe summaries.
 *
 * Used before: writing structured logs, sending context to an AI provider,
 * and showing offshore support staff a minimised view.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// NZ-ish phone patterns and generic long digit runs.
const PHONE_RE = /(\+?64|0)[\s-]?\d(?:[\s-]?\d){6,9}/g;
const LONG_DIGITS_RE = /\b\d{6,}\b/g;

export function redactText(input: string): string {
  return input
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(PHONE_RE, "[redacted-phone]")
    .replace(LONG_DIGITS_RE, "[redacted-number]");
}

/** Mask an email keeping first char + domain: a***@example.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[redacted-email]";
  const head = local.slice(0, 1);
  return `${head}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
}

const SENSITIVE_KEYS = [
  "password",
  "passwordhash",
  "token",
  "secret",
  "authorization",
  "cardnumber",
  "cvc",
  "apikey",
  "api_key",
  "clientsecret",
  "client_secret",
  "wanmac", // device identifiers kept out of general logs
  "serialnumber",
  "email",
  "phone",
  "fullname",
  "contactname",
  "line1",
  "address",
];

/**
 * Recursively redact an object for safe logging. Sensitive keys are replaced
 * with "[redacted]"; string values are scrubbed of emails/phones/long numbers.
 */
export function redactObject(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") return redactText(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => redactObject(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
        out[k] = "[redacted]";
      } else {
        out[k] = redactObject(v, depth + 1);
      }
    }
    return out;
  }
  return "[unserialisable]";
}
