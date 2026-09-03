/**
 * Account-hold service. Holds protect customers (especially in hardship or
 * dispute) from automatic suspension. Creating/closing/expiring a hold is
 * audited and recorded in HoldHistory.
 */
import { prisma } from "@/lib/db";
import { recordAudit } from "./audit";
import { holdBlocksSuspension, isHoldEffective, type HoldType } from "@/lib/domain/holds";

export interface CreateHoldInput {
  userId: string;
  serviceOrderId?: string | null;
  holdType: HoldType;
  reason: string;
  createdById?: string | null;
  createdByLabel: string;
  expiresAt?: Date | null;
  reviewDate?: Date | null;
  note?: string | null;
  approvedById?: string | null;
  approvedByLabel?: string | null;
}

export async function createHold(input: CreateHoldInput) {
  const hold = await prisma.accountHold.create({
    data: {
      userId: input.userId,
      serviceOrderId: input.serviceOrderId ?? null,
      holdType: input.holdType,
      reason: input.reason,
      createdById: input.createdById ?? null,
      createdByLabel: input.createdByLabel,
      expiresAt: input.expiresAt ?? null,
      reviewDate: input.reviewDate ?? null,
      note: input.note ?? null,
      approvedById: input.approvedById ?? null,
      approvedByLabel: input.approvedByLabel ?? null,
    },
  });
  await prisma.holdHistory.create({
    data: { holdId: hold.id, event: "created", detail: input.reason, actorLabel: input.createdByLabel },
  });
  await recordAudit({
    type: "hold.created",
    actorId: input.createdById,
    actorLabel: input.createdByLabel,
    targetType: "hold",
    targetId: hold.id,
    reason: input.reason,
    metadata: { holdType: input.holdType, serviceOrderId: input.serviceOrderId ?? null, expiresAt: input.expiresAt?.toISOString() ?? null },
  });
  return hold;
}

export async function closeHold(holdId: string, actorLabel: string, closureReason: string, actorId?: string | null) {
  const hold = await prisma.accountHold.update({
    where: { id: holdId },
    data: { active: false, closedAt: new Date(), closureReason },
  });
  await prisma.holdHistory.create({
    data: { holdId, event: "closed", detail: closureReason, actorLabel },
  });
  await recordAudit({
    type: "hold.closed",
    actorId: actorId ?? null,
    actorLabel,
    targetType: "hold",
    targetId: holdId,
    reason: closureReason,
    metadata: { holdType: hold.holdType },
  });
  return hold;
}

/** Expire holds past their expiry (background job). Returns count expired. */
export async function expireHolds(now: Date = new Date()): Promise<number> {
  const due = await prisma.accountHold.findMany({
    where: { active: true, expiresAt: { not: null, lte: now } },
  });
  for (const hold of due) {
    await prisma.accountHold.update({ where: { id: hold.id }, data: { active: false, closedAt: now, closureReason: "expired" } });
    await prisma.holdHistory.create({ data: { holdId: hold.id, event: "expired", detail: "Hold reached its expiry", actorLabel: "system" } });
    await recordAudit({ type: "hold.expired", actorLabel: "system", targetType: "hold", targetId: hold.id, metadata: { holdType: hold.holdType } });
  }
  return due.length;
}

export async function listActiveHolds(opts: { userId?: string; serviceOrderId?: string }) {
  const holds = await prisma.accountHold.findMany({
    where: {
      active: true,
      ...(opts.userId ? { userId: opts.userId } : {}),
      ...(opts.serviceOrderId ? { serviceOrderId: opts.serviceOrderId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return holds.filter((h) => isHoldEffective(h));
}

/**
 * Determine whether automatic suspension is blocked for an order, considering
 * holds on the order itself AND holds on the owning customer (account-wide).
 * Returns the first effective blocking hold, if any.
 */
export async function findBlockingHold(serviceOrderId: string) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    include: { application: true },
  });
  const userId = order?.application.userId ?? undefined;
  const holds = await prisma.accountHold.findMany({
    where: {
      active: true,
      OR: [{ serviceOrderId }, ...(userId ? [{ userId }] : [])],
    },
  });
  const effective = holds.find((h) => isHoldEffective(h) && holdBlocksSuspension(h.holdType as HoldType));
  return effective ?? null;
}
