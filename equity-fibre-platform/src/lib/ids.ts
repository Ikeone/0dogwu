import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

/** Human-friendly reference like EF-7K3M9Q. */
export function humanRef(prefix: string, len = 6): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `${prefix}-${out}`;
}

export function idempotencyKey(...parts: string[]): string {
  return parts.join(":");
}
