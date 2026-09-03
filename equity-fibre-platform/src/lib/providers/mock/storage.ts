import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import type {
  ObjectStorageProvider,
  StoredObject,
} from "@/lib/providers/types";
import { getEnv } from "@/lib/config/env";

/**
 * Local private object storage for eligibility evidence (DEMO ONLY).
 *
 * - Files are stored OUTSIDE the Next public directory (./storage).
 * - Object keys are random (no user-controlled paths -> no traversal).
 * - Contents are encrypted at rest (AES-256-GCM) with FIELD_ENCRYPTION_KEY.
 * - "Signed URL" is a time-limited token to an authenticated API route; this
 *   provider NEVER returns a public URL.
 *
 * Production: replace with an S3-compatible private bucket (see docs).
 */
const STORAGE_DIR = join(process.cwd(), "storage", "evidence");

function keyBytes(): Buffer {
  // Derive a 32-byte key from FIELD_ENCRYPTION_KEY deterministically.
  return createHash("sha256").update(getEnv().FIELD_ENCRYPTION_KEY).digest();
}

export class LocalObjectStorageProvider implements ObjectStorageProvider {
  readonly name = "local-storage";

  async put(bytes: Buffer, _contentType: string): Promise<StoredObject> {
    await mkdir(STORAGE_DIR, { recursive: true });
    const storageKey = randomBytes(24).toString("hex");
    const integrityHash = createHash("sha256").update(bytes).digest("hex");

    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
    const enc = Buffer.concat([cipher.update(bytes), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Layout: [12b iv][16b tag][ciphertext]
    await writeFile(join(STORAGE_DIR, storageKey), Buffer.concat([iv, tag, enc]));

    return { storageKey, integrityHash, sizeBytes: bytes.length };
  }

  async read(storageKey: string): Promise<Buffer> {
    const raw = await readFile(join(STORAGE_DIR, safeKey(storageKey)));
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]);
  }

  async getSignedUrl(storageKey: string, ttlSeconds: number): Promise<string> {
    const exp = Date.now() + ttlSeconds * 1000;
    const sig = createHash("sha256")
      .update(`${storageKey}.${exp}.${getEnv().AUTH_SECRET}`)
      .digest("hex")
      .slice(0, 32);
    return `/api/evidence/${encodeURIComponent(storageKey)}?exp=${exp}&sig=${sig}`;
  }

  async delete(storageKey: string): Promise<void> {
    await unlink(join(STORAGE_DIR, safeKey(storageKey))).catch(() => undefined);
  }
}

/** Guard: object keys are hex only — reject anything else (no traversal). */
export function safeKey(storageKey: string): string {
  if (!/^[0-9a-f]{48}$/.test(storageKey)) {
    throw new Error("Invalid storage key.");
  }
  return storageKey;
}
