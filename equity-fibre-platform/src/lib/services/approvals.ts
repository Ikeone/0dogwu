/**
 * Maker-checker approval workflow for high-risk operations. In PILOT/PRODUCTION,
 * a change to price, eligibility logic, suspension policy, evidence retention or
 * payment trigger (and refunds above threshold, kill switches, role changes)
 * requires a maker to request and a *different* checker to approve, with an
 * effective date and audit record. In DEMO/SANDBOX changes may apply directly.
 */
import { prisma } from "@/lib/db";
import { getModePolicy } from "@/lib/config/mode";
import { recordAudit } from "./audit";

export type ApprovalType =
  | "config_change"
  | "rule_change"
  | "refund"
  | "killswitch"
  | "role_change"
  | "data_export";

export function requiresMakerChecker(): boolean {
  const { systemMode } = getModePolicy();
  return systemMode === "PILOT" || systemMode === "PRODUCTION";
}

export async function createApprovalRequest(
  type: ApprovalType,
  payload: unknown,
  requestedById: string | null,
  requestedByLabel: string,
  reason: string,
) {
  const req = await prisma.approvalRequest.create({
    data: {
      type,
      payloadJson: JSON.stringify(payload),
      status: "pending",
      reason,
      requestedById: requestedById ?? null,
      requestedByLabel,
    },
  });
  await recordAudit({
    type: "approval.requested",
    actorId: requestedById,
    actorLabel: requestedByLabel,
    targetType: "approval",
    targetId: req.id,
    reason,
    metadata: { approvalType: type },
  });
  return req;
}

export class SelfApprovalError extends Error {
  constructor() {
    super("The approver must be different from the requester (maker-checker).");
    this.name = "SelfApprovalError";
  }
}

/** Approve a request. Enforces maker != checker. Returns the parsed payload. */
export async function approveRequest(id: string, approverId: string, approverLabel: string) {
  const req = await prisma.approvalRequest.findUniqueOrThrow({ where: { id } });
  if (req.status !== "pending") throw new Error(`Approval ${id} is not pending.`);
  if (req.requestedById && req.requestedById === approverId) throw new SelfApprovalError();

  await prisma.approvalRequest.update({
    where: { id },
    data: { status: "approved", approvedById: approverId, approvedByLabel: approverLabel, decidedAt: new Date() },
  });
  await recordAudit({
    type: "approval.approved",
    actorId: approverId,
    actorLabel: approverLabel,
    targetType: "approval",
    targetId: id,
    metadata: { approvalType: req.type },
  });
  return { type: req.type, payload: JSON.parse(req.payloadJson) as unknown };
}

export async function rejectRequest(id: string, approverId: string, approverLabel: string, reason: string) {
  const req = await prisma.approvalRequest.findUniqueOrThrow({ where: { id } });
  if (req.requestedById && req.requestedById === approverId) throw new SelfApprovalError();
  await prisma.approvalRequest.update({
    where: { id },
    data: { status: "rejected", approvedById: approverId, approvedByLabel: approverLabel, decidedAt: new Date() },
  });
  await recordAudit({
    type: "approval.rejected",
    actorId: approverId,
    actorLabel: approverLabel,
    targetType: "approval",
    targetId: id,
    reason,
  });
}

export async function markApplied(id: string) {
  await prisma.approvalRequest.update({ where: { id }, data: { status: "applied" } });
}
