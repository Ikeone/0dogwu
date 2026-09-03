/**
 * Eligibility evidence handling. Security-critical:
 * - Validates real file signature (magic bytes), not just the extension.
 * - Enforces an allow-list of MIME types and a strict size limit.
 * - Stores in PRIVATE, encrypted storage with a random key (no traversal).
 * - Records an integrity hash + retention date; malware scan state starts
 *   "pending" (a scanning interface hook is documented for production).
 * - Never stores a public URL.
 */
import { prisma } from "@/lib/db";
import { getObjectStorageProvider } from "@/lib/providers/factory";
import { getBusinessConfig } from "./config";
import { recordAudit } from "./audit";

export interface DetectedType {
  mime: string;
  ok: boolean;
}

/** Sniff file signature. Returns the detected MIME or ok:false. */
export function sniffFileType(bytes: Buffer): DetectedType {
  const hex = bytes.subarray(0, 8).toString("hex").toUpperCase();
  if (hex.startsWith("89504E47")) return { mime: "image/png", ok: true };
  if (hex.startsWith("FFD8FF")) return { mime: "image/jpeg", ok: true };
  if (hex.startsWith("25504446")) return { mime: "application/pdf", ok: true }; // %PDF
  return { mime: "application/octet-stream", ok: false };
}

export class EvidenceRejectedError extends Error {}

export async function storeEvidence(
  applicationId: string,
  evidenceType: string,
  originalName: string,
  bytes: Buffer,
) {
  const cfg = await getBusinessConfig();
  if (bytes.length === 0) throw new EvidenceRejectedError("Empty file.");
  if (bytes.length > cfg.evidence.maxUploadBytes) {
    throw new EvidenceRejectedError("File is too large.");
  }
  const detected = sniffFileType(bytes);
  if (!detected.ok || !cfg.evidence.allowedMimeTypes.includes(detected.mime)) {
    // Rejects e.g. executables masquerading as images/pdf.
    throw new EvidenceRejectedError(
      "Unsupported file type. Please upload a PNG, JPEG, or PDF.",
    );
  }

  const stored = await getObjectStorageProvider().put(bytes, detected.mime);
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);

  const evidence = await prisma.eligibilityEvidence.create({
    data: {
      applicationId,
      evidenceType,
      storageKey: stored.storageKey,
      originalName: originalName.slice(0, 200),
      safeName,
      sizeBytes: stored.sizeBytes,
      detectedMime: detected.mime,
      integrityHash: stored.integrityHash,
      reviewState: "pending",
      malwareState: "pending",
      retentionUntil: new Date(Date.now() + cfg.evidence.retentionDays * 86400_000),
    },
  });
  await recordAudit({
    type: "evidence.uploaded",
    actorLabel: "customer",
    targetType: "evidence",
    targetId: evidence.id,
    metadata: { mime: detected.mime, sizeBytes: stored.sizeBytes, retentionDays: cfg.evidence.retentionDays },
  });
  return evidence;
}

/**
 * Retention/deletion job with a dry-run mode. Returns the evidence that is past
 * its retention date; when dryRun is false it deletes the stored objects.
 */
export async function runRetentionJob(dryRun = true) {
  const due = await prisma.eligibilityEvidence.findMany({
    where: { retentionUntil: { lt: new Date() } },
  });
  if (!dryRun) {
    const storage = getObjectStorageProvider();
    for (const e of due) {
      await storage.delete(e.storageKey);
      await prisma.eligibilityEvidence.delete({ where: { id: e.id } });
      await recordAudit({
        type: "evidence.deleted_retention",
        actorLabel: "system",
        targetType: "evidence",
        targetId: e.id,
      });
    }
  }
  return { dueCount: due.length, dryRun };
}
