/**
 * Suspension safety guard. Automatic suspension MUST NOT proceed while a
 * protective hold is active (hardship, dispute, complaint, provider outage,
 * WN billing error, vulnerable customer, legal). Every evaluation is recorded
 * as an immutable SuspensionDecision and audited.
 */
import { prisma } from "@/lib/db";
import { findBlockingHold } from "./holds";
import { transitionSubscription } from "./orders";
import { recordAudit } from "./audit";
import { sendNotification } from "./notifications";

export type SuspensionOutcome = "suspended" | "blocked" | "skipped" | "manual_review";

/**
 * Non-mutating preview: what WOULD happen if suspension were evaluated now.
 * Used by the admin "suspension preview" UI. Does not record or perform.
 */
export async function previewSuspension(serviceOrderId: string): Promise<SuspensionResult> {
  const order = await prisma.serviceOrder.findUniqueOrThrow({
    where: { id: serviceOrderId },
    include: { application: true },
  });
  const blocking = await findBlockingHold(serviceOrderId);
  if (blocking) {
    return { outcome: "blocked", reason: `Active ${blocking.holdType.replace(/_/g, " ")} hold`, blockingHoldId: blocking.id };
  }
  const userId = order.application.userId ?? undefined;
  if (userId) {
    const [h, d] = await Promise.all([
      prisma.hardshipCase.count({ where: { userId, status: { in: ["open", "in_progress"] } } }),
      prisma.billingDispute.count({ where: { userId, status: { in: ["open", "investigating"] } } }),
    ]);
    if (h > 0) return { outcome: "blocked", reason: "Open hardship case" };
    if (d > 0) return { outcome: "blocked", reason: "Open billing dispute" };
  }
  if (order.status !== "ACTIVE") return { outcome: "skipped", reason: `Order is ${order.status}` };
  return { outcome: "suspended", reason: "No blocking holds; would suspend" };
}

export interface SuspensionResult {
  outcome: SuspensionOutcome;
  reason: string;
  blockingHoldId?: string | null;
}

export interface EvaluateSuspensionOptions {
  trigger: string; // e.g. "monthly_payment_failed"
  actorLabel: string;
  /** True when the failed payment was caused by a WN/provider error. */
  providerCausedFailure?: boolean;
}

/**
 * Evaluate whether an order may be automatically suspended. Blocks on any
 * effective hold, open hardship/dispute, or a provider-caused failure. Records
 * the decision either way.
 */
export async function evaluateSuspension(
  serviceOrderId: string,
  opts: EvaluateSuspensionOptions,
): Promise<SuspensionResult> {
  const order = await prisma.serviceOrder.findUniqueOrThrow({
    where: { id: serviceOrderId },
    include: { application: true },
  });

  const record = async (r: SuspensionResult) => {
    await prisma.suspensionDecision.create({
      data: {
        serviceOrderId,
        outcome: r.outcome,
        reason: r.reason,
        blockingHoldId: r.blockingHoldId ?? null,
        trigger: opts.trigger,
        decidedByLabel: opts.actorLabel,
      },
    });
    await recordAudit({
      type: "suspension.decision",
      actorLabel: opts.actorLabel,
      targetType: "order",
      targetId: serviceOrderId,
      reason: r.reason,
      metadata: { outcome: r.outcome, trigger: opts.trigger, blockingHoldId: r.blockingHoldId ?? null },
    });
    return r;
  };

  // 1. Provider/WN-caused failure never punishes the customer.
  if (opts.providerCausedFailure) {
    return record({ outcome: "blocked", reason: "Payment failure was caused by a WN/provider error; suspension withheld." });
  }

  // 2. Any effective protective hold blocks suspension.
  const blocking = await findBlockingHold(serviceOrderId);
  if (blocking) {
    // Ensure a person follows up.
    await sendNotification(serviceOrderId, "suspension_withheld", "We've paused any suspension while we help you").catch(() => undefined);
    return record({
      outcome: "blocked",
      reason: `Suspension blocked by an active ${blocking.holdType.replace(/_/g, " ")} hold.`,
      blockingHoldId: blocking.id,
    });
  }

  // 3. Open hardship or dispute (belt-and-braces even without an explicit hold).
  const userId = order.application.userId ?? undefined;
  if (userId) {
    const [openHardship, openDispute] = await Promise.all([
      prisma.hardshipCase.count({ where: { userId, status: { in: ["open", "in_progress"] } } }),
      prisma.billingDispute.count({ where: { userId, status: { in: ["open", "investigating"] } } }),
    ]);
    if (openHardship > 0) return record({ outcome: "blocked", reason: "An open hardship case blocks automatic suspension." });
    if (openDispute > 0) return record({ outcome: "blocked", reason: "An open billing dispute blocks automatic suspension." });
  }

  // 4. Only ACTIVE services can be suspended; otherwise skip (idempotent/safe).
  if (order.status !== "ACTIVE") {
    return record({ outcome: "skipped", reason: `Order is ${order.status}; no suspension performed.` });
  }

  // 5. Perform the suspension with an ATOMIC conditional update so exactly one
  //    concurrent attempt wins (the DB evaluates `status = ACTIVE` at execution
  //    time). On PostgreSQL this is a single-row conditional UPDATE; the same
  //    pattern gives at-most-once transition under concurrency.
  const claimed = await prisma.serviceOrder.updateMany({
    where: { id: serviceOrderId, status: "ACTIVE" },
    data: { status: "SUSPENDED" },
  });
  if (claimed.count === 0) {
    return record({ outcome: "skipped", reason: "Order was not ACTIVE at commit time (concurrent change)." });
  }

  await recordAudit({
    type: "order.transition",
    actorLabel: opts.actorLabel,
    targetType: "order",
    targetId: serviceOrderId,
    reason: `Suspension: ${opts.trigger}`,
    metadata: { from: "ACTIVE", to: "SUSPENDED" },
  });
  await transitionSubscription(serviceOrderId, "SUSPENDED", opts.actorLabel, `Suspension: ${opts.trigger}`).catch(() => undefined);
  await sendNotification(serviceOrderId, "service_suspended", "Your service has been suspended").catch(() => undefined);
  return record({ outcome: "suspended", reason: `Suspended following ${opts.trigger}.` });
}
