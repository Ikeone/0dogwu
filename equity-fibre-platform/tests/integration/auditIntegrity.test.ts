import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/services/audit";
import { computeAuditDigest, verifyAuditExport, auditDigestForRange, type AuditRowForDigest } from "@/lib/services/auditIntegrity";

async function seedAudits(tag: string, n: number) {
  const from = new Date();
  for (let i = 0; i < n; i++) {
    await recordAudit({ type: `test.${tag}.${i}`, actorLabel: "tester", targetType: "t", targetId: `${tag}-${i}`, metadata: { i } });
  }
  return from;
}

async function rangeRows(from: Date, to: Date): Promise<AuditRowForDigest[]> {
  return prisma.auditEvent.findMany({
    where: { createdAt: { gte: from, lte: to }, type: { startsWith: "test." } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, type: true, actorLabel: true, targetType: true, targetId: true, reason: true, metadataJson: true, createdAt: true },
  });
}

describe("audit integrity (tamper-evident export)", () => {
  it("produces a deterministic digest for the same rows", async () => {
    const tag = `d${Date.now()}`;
    const from = await seedAudits(tag, 5);
    const rows = await rangeRows(from, new Date(Date.now() + 1000));
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(computeAuditDigest(rows)).toBe(computeAuditDigest(rows));
  });

  it("detects tampering with an audit record", async () => {
    const tag = `t${Date.now()}`;
    const from = await seedAudits(tag, 4);
    const rows = await rangeRows(from, new Date(Date.now() + 1000));
    const digest = computeAuditDigest(rows);
    expect(verifyAuditExport(rows, digest)).toBe(true);

    // Simulate tampering (which production DB roles must forbid).
    await prisma.auditEvent.update({ where: { id: rows[0]!.id }, data: { reason: "tampered" } });
    const rowsAfter = await rangeRows(from, new Date(Date.now() + 1000));
    expect(verifyAuditExport(rowsAfter, digest)).toBe(false);
  });

  it("detects removal of an audit record", async () => {
    const tag = `r${Date.now()}`;
    const from = await seedAudits(tag, 4);
    const rows = await rangeRows(from, new Date(Date.now() + 1000));
    const digest = computeAuditDigest(rows);
    const removed = rows.slice(1);
    expect(verifyAuditExport(removed, digest)).toBe(false);
  });

  it("auditDigestForRange returns a stable digest + count", async () => {
    const tag = `g${Date.now()}`;
    const from = await seedAudits(tag, 3);
    const to = new Date(Date.now() + 1000);
    const a = await auditDigestForRange(from, to);
    const b = await auditDigestForRange(from, to);
    expect(a.digest).toBe(b.digest);
    expect(a.count).toBeGreaterThanOrEqual(3);
  });
});
