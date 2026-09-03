/**
 * Envelope field encryption for high-risk secrets that do NOT need to be
 * searchable (e.g. TOTP seeds, device factory credentials). AES-256-GCM via
 * Node's crypto (standard primitive, not home-grown crypto). The key is derived
 * from FIELD_ENCRYPTION_KEY; in production this must come from a KMS/secret
 * manager (see docs/SECURITY.md and BLOCKED_EXTERNAL SEC-KMS).
 *
 * Format (base64): [1-byte version][12-byte iv][16-byte tag][ciphertext]
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getEnv } from "@/lib/config/env";

const VERSION = 0x01;

function key(): Buffer {
  return createHash("sha256").update(getEnv().FIELD_ENCRYPTION_KEY).digest();
}

export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, enc]).toString("base64");
}

export function decryptField(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  if (raw[0] !== VERSION) throw new Error("Unsupported field-crypto version.");
  const iv = raw.subarray(1, 13);
  const tag = raw.subarray(13, 29);
  const enc = raw.subarray(29);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
