/**
 * Audit integrity — tamper-evident export digest.
 *
 * The audit service is append-only at the application layer (there is no update
 * or delete API). This module adds *export verification*: a deterministic digest
 * over an ordered set of audit events. If any event is altered, added, removed
 * or reordered, the digest changes — so an exported audit trail can be verified
 * against a previously-recorded digest.
 *
 * NOTE: Database-level append-only enforcement (roles/triggers preventing the
 * application role from UPDATE/DELETE on audit rows) is a PostgreSQL task and is
 * documented in docs/PRODUCTION_ARCHITECTURE.md (BLOCKED on Postgres runtime).
 */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export interface AuditRowForDigest {
  id: string;
  type: string;
  actorLabel: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  metadataJson: string;
  createdAt: Date;
}

/** Canonical, order-sensitive serialisation of one audit row. */
function canonical(row: AuditRowForDigest): string {
  return [
    row.createdAt.toISOString(),
    row.id,
    row.type,
    row.actorLabel,
    row.targetType ?? "",
    row.targetId ?? "",
    row.reason ?? "",
    row.metadataJson,
  ].join("\u001f");
}

/** Deterministic digest over an ordered list of audit rows. */
export function computeAuditDigest(rows: AuditRowForDigest[]): string {
  const h = createHash("sha256");
  for (const row of rows) {
    h.update(canonical(row));
    h.update("\u001e");
  }
  return h.digest("hex");
}

/** Verify an exported set of rows against an expected digest. */
export function verifyAuditExport(rows: AuditRowForDigest[], expectedDigest: string): boolean {
  return computeAuditDigest(rows) === expectedDigest;
}

/** Compute the digest for all audit events in a time range (deterministic order). */
export async function auditDigestForRange(from: Date, to: Date): Promise<{ digest: string; count: number }> {
  const rows = await prisma.auditEvent.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, type: true, actorLabel: true, targetType: true, targetId: true, reason: true, metadataJson: true, createdAt: true },
  });
  return { digest: computeAuditDigest(rows), count: rows.length };
}
