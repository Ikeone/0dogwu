/**
 * Append-only audit service. Ordinary staff cannot edit or delete audit rows
 * (there is no update/delete API here). Metadata is redacted before storage.
 */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { redactObject } from "@/lib/domain/redaction";

export interface AuditInput {
  type: string;
  actorId?: string | null;
  actorLabel: string;
  targetType?: string | null;
  targetId?: string | null;
  correlationId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  const safeMeta = input.metadata ? redactObject(input.metadata) : {};
  await prisma.auditEvent.create({
    data: {
      type: input.type,
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      correlationId: input.correlationId ?? null,
      reason: input.reason ?? null,
      metadataJson: JSON.stringify(safeMeta),
    },
  });
}

/** Store only a salted hash of an IP for privacy-conscious audit. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`ip:${ip}`).digest("hex").slice(0, 16);
}
