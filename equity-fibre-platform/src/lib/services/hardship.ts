/**
 * Hardship cases and billing disputes. Creating either immediately places a
 * protective AccountHold so the customer cannot be auto-suspended while their
 * case is open. Resolution closes the linked hold.
 */
import { prisma } from "@/lib/db";
import { createHold, closeHold } from "./holds";
import { recordAudit } from "./audit";
import { humanRef } from "@/lib/ids";

export async function createHardshipCase(input: {
  userId: string;
  serviceOrderId?: string | null;
  reason: string;
  detail?: string;
  actorLabel: string;
}) {
  const caseRow = await prisma.hardshipCase.create({
    data: {
      userId: input.userId,
      serviceOrderId: input.serviceOrderId ?? null,
      reference: humanRef("HDS"),
      reason: input.reason,
      detail: input.detail ?? null,
      status: "open",
    },
  });
  // Immediate protective hold (30-day review window).
  const hold = await createHold({
    userId: input.userId,
    serviceOrderId: input.serviceOrderId ?? null,
    holdType: "financial_hardship",
    reason: `Hardship case ${caseRow.reference}`,
    createdByLabel: input.actorLabel,
    expiresAt: new Date(Date.now() + 30 * 86400_000),
    reviewDate: new Date(Date.now() + 14 * 86400_000),
  });
  await prisma.hardshipCase.update({ where: { id: caseRow.id }, data: { holdId: hold.id } });
  await recordAudit({ type: "hardship.opened", actorLabel: input.actorLabel, targetType: "hardship", targetId: caseRow.id, reason: input.reason });
  return { case: caseRow, holdId: hold.id };
}

export async function createBillingDispute(input: {
  userId: string;
  serviceOrderId?: string | null;
  transactionId?: string | null;
  reason: string;
  amountCents?: number | null;
  actorLabel: string;
}) {
  const dispute = await prisma.billingDispute.create({
    data: {
      userId: input.userId,
      serviceOrderId: input.serviceOrderId ?? null,
      transactionId: input.transactionId ?? null,
      reference: humanRef("DSP"),
      reason: input.reason,
      amountCents: input.amountCents ?? null,
      status: "open",
    },
  });
  const hold = await createHold({
    userId: input.userId,
    serviceOrderId: input.serviceOrderId ?? null,
    holdType: "payment_dispute",
    reason: `Billing dispute ${dispute.reference}`,
    createdByLabel: input.actorLabel,
    reviewDate: new Date(Date.now() + 7 * 86400_000),
  });
  await prisma.billingDispute.update({ where: { id: dispute.id }, data: { holdId: hold.id } });
  await recordAudit({ type: "dispute.opened", actorLabel: input.actorLabel, targetType: "dispute", targetId: dispute.id, reason: input.reason });
  return { dispute, holdId: hold.id };
}

export async function resolveHardshipCase(caseId: string, status: "resolved" | "declined", actorLabel: string, actorId?: string) {
  const caseRow = await prisma.hardshipCase.update({
    where: { id: caseId },
    data: { status, resolvedAt: new Date() },
  });
  if (caseRow.holdId) {
    await closeHold(caseRow.holdId, actorLabel, `Hardship case ${status}`, actorId ?? null);
  }
  await recordAudit({ type: "hardship.resolved", actorId: actorId ?? null, actorLabel, targetType: "hardship", targetId: caseId, metadata: { status } });
  return caseRow;
}

export async function resolveDispute(disputeId: string, status: "upheld" | "rejected" | "resolved", actorLabel: string, actorId?: string) {
  const dispute = await prisma.billingDispute.update({
    where: { id: disputeId },
    data: { status, resolvedAt: new Date() },
  });
  if (dispute.holdId) {
    await closeHold(dispute.holdId, actorLabel, `Dispute ${status}`, actorId ?? null);
  }
  await recordAudit({ type: "dispute.resolved", actorId: actorId ?? null, actorLabel, targetType: "dispute", targetId: disputeId, metadata: { status } });
  return dispute;
}
