/**
 * Reconciliation jobs. For unknown/lost-response cases the system must query
 * (or, in MANUAL mode, flag for a human to query) provider state before
 * repeating any side effect. This is at-least-once processing with idempotent
 * consumers + reconciliation — NOT a claim of exactly-once distributed delivery.
 */
import { prisma } from "@/lib/db";
import { recordAudit } from "./audit";
import { logger } from "@/lib/logger";

/**
 * Crash recovery: jobs stuck in RUNNING beyond a lease timeout are returned to
 * PENDING so another worker can retry (idempotently). Returns the count reset.
 */
export async function reconcileStuckJobs(leaseMinutes = 15): Promise<number> {
  const cutoff = new Date(Date.now() - leaseMinutes * 60_000);
  const stuck = await prisma.integrationJob.findMany({
    where: { status: "RUNNING", updatedAt: { lt: cutoff } },
  });
  for (const job of stuck) {
    await prisma.integrationJob.update({
      where: { id: job.id },
      data: { status: "PENDING", nextRunAt: new Date() },
    });
    await recordAudit({
      type: "job.lease_recovered",
      actorLabel: "reconciliation",
      targetType: "job",
      targetId: job.id,
      metadata: { type: job.type, leaseMinutes },
    });
  }
  if (stuck.length) logger.info("reconcile.stuck_jobs", { count: stuck.length });
  return stuck.length;
}

/**
 * Flag provisioning orders stuck in an in-progress/blocked state beyond a
 * threshold for operations review. In real provider modes the operator (or an
 * automated reconciler) queries provider state before any retry.
 */
export async function reconcileStuckProvisioning(staleMinutes = 60) {
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);
  const stuck = await prisma.serviceOrder.findMany({
    where: {
      status: { in: ["PROVISIONING_REQUESTED", "PROVISIONING_IN_PROGRESS", "PROVISIONING_BLOCKED"] },
      updatedAt: { lt: cutoff },
    },
    include: { provisioning: true },
  });
  for (const order of stuck) {
    await recordAudit({
      type: "provisioning.reconcile_flagged",
      actorLabel: "reconciliation",
      targetType: "order",
      targetId: order.id,
      reason: `Stuck in ${order.status} for over ${staleMinutes} minutes`,
      metadata: { correlationId: order.provisioning?.correlationId ?? null },
    });
  }
  return stuck.map((o) => ({ id: o.id, reference: o.reference, status: o.status }));
}
