import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { createHold, closeHold, expireHolds, findBlockingHold } from "@/lib/services/holds";
import { createHardshipCase, createBillingDispute } from "@/lib/services/hardship";
import { evaluateSuspension } from "@/lib/services/suspension";
import { hasCapability } from "@/lib/auth/rbac";
import { humanRef } from "@/lib/ids";

async function activeOrder(tag: string) {
  const user = await prisma.user.create({
    data: { email: `susp.${tag}@demo.nz`, displayName: `Susp ${tag}`, isStaff: false },
  });
  const address = await prisma.address.create({
    data: { line1: `1 Susp ${tag}`, suburb: "T", city: "D", postcode: "7999", hasOnt: true },
  });
  const app = await prisma.eligibilityApplication.create({
    data: { reference: humanRef("EF"), userId: user.id, addressId: address.id, status: "ELIGIBLE", contactEmail: user.email, contactName: user.displayName },
  });
  const order = await prisma.serviceOrder.create({
    data: { reference: humanRef("SO"), applicationId: app.id, planCode: "EQUITY_FIBRE_100", status: "ACTIVE", modemPaymentTrigger: "BEFORE_SHIPMENT", monthlyBillingTrigger: "SERVICE_ACTIVATION" },
  });
  await prisma.subscription.create({ data: { serviceOrderId: order.id, status: "ACTIVE", monthlyPriceCents: 3000 } });
  return { user, order };
}

async function status(orderId: string) {
  return (await prisma.serviceOrder.findUniqueOrThrow({ where: { id: orderId } })).status;
}

describe("suspension safety guard", () => {
  it("suspends an active service with no protective hold", async () => {
    const { order } = await activeOrder(`ok${Date.now()}`);
    const r = await evaluateSuspension(order.id, { trigger: "monthly_payment_failed", actorLabel: "test" });
    expect(r.outcome).toBe("suspended");
    expect(await status(order.id)).toBe("SUSPENDED");
  });

  it("does NOT auto-suspend a customer with an active hardship hold", async () => {
    const { user, order } = await activeOrder(`hh${Date.now()}`);
    await createHold({ userId: user.id, serviceOrderId: order.id, holdType: "financial_hardship", reason: "hardship", createdByLabel: "test" });
    const r = await evaluateSuspension(order.id, { trigger: "monthly_payment_failed", actorLabel: "test" });
    expect(r.outcome).toBe("blocked");
    expect(r.blockingHoldId).toBeTruthy();
    expect(await status(order.id)).toBe("ACTIVE");
  });

  it("does NOT auto-suspend when a payment dispute is open", async () => {
    const { user, order } = await activeOrder(`dp${Date.now()}`);
    await createBillingDispute({ userId: user.id, serviceOrderId: order.id, reason: "charged twice", actorLabel: "customer" });
    const r = await evaluateSuspension(order.id, { trigger: "monthly_payment_failed", actorLabel: "test" });
    expect(r.outcome).toBe("blocked");
    expect(await status(order.id)).toBe("ACTIVE");
  });

  it("does NOT punish the customer for a provider/WN-caused failure", async () => {
    const { order } = await activeOrder(`pv${Date.now()}`);
    const r = await evaluateSuspension(order.id, { trigger: "monthly_payment_failed", actorLabel: "test", providerCausedFailure: true });
    expect(r.outcome).toBe("blocked");
    expect(await status(order.id)).toBe("ACTIVE");
  });

  it("an expired hold no longer blocks suspension; suspension then resumes", async () => {
    const { user, order } = await activeOrder(`ex${Date.now()}`);
    await createHold({ userId: user.id, serviceOrderId: order.id, holdType: "manual_operational", reason: "temp", createdByLabel: "test", expiresAt: new Date(Date.now() - 1000) });
    // Effective check already treats it as expired.
    expect(await findBlockingHold(order.id)).toBeNull();
    const expired = await expireHolds();
    expect(expired).toBeGreaterThanOrEqual(1);
    const r = await evaluateSuspension(order.id, { trigger: "monthly_payment_failed", actorLabel: "test" });
    expect(r.outcome).toBe("suspended");
    expect(await status(order.id)).toBe("SUSPENDED");
  });

  it("hardship case creates a protective hold that blocks suspension end-to-end", async () => {
    const { user, order } = await activeOrder(`e2e${Date.now()}`);
    await createHardshipCase({ userId: user.id, serviceOrderId: order.id, reason: "lost income", actorLabel: "customer" });
    const r = await evaluateSuspension(order.id, { trigger: "monthly_payment_failed", actorLabel: "test" });
    expect(r.outcome).toBe("blocked");
    expect(await status(order.id)).toBe("ACTIVE");
  });

  it("removing a hold is audited and then allows suspension", async () => {
    const { user, order } = await activeOrder(`rm${Date.now()}`);
    const hold = await createHold({ userId: user.id, serviceOrderId: order.id, holdType: "manual_operational", reason: "temp", createdByLabel: "test" });
    await closeHold(hold.id, "operator@wn.demo", "resolved", null);
    const audit = await prisma.auditEvent.findFirst({ where: { type: "hold.closed", targetId: hold.id } });
    expect(audit).not.toBeNull();
    const r = await evaluateSuspension(order.id, { trigger: "monthly_payment_failed", actorLabel: "test" });
    expect(r.outcome).toBe("suspended");
  });

  it("concurrent suspension attempts are safe (exactly one suspends)", async () => {
    const { order } = await activeOrder(`cc${Date.now()}`);
    const [a, b] = await Promise.all([
      evaluateSuspension(order.id, { trigger: "t1", actorLabel: "test" }),
      evaluateSuspension(order.id, { trigger: "t2", actorLabel: "test" }),
    ]);
    const outcomes = [a.outcome, b.outcome].sort();
    expect(outcomes).toEqual(["skipped", "suspended"]);
    expect(await status(order.id)).toBe("SUSPENDED");
  });

  it("manual suspension requires the correct capability (authz)", () => {
    expect(hasCapability(["SUPPORT"], "suspension.operate")).toBe(false);
    expect(hasCapability(["OPERATIONS"], "suspension.operate")).toBe(true);
    expect(hasCapability(["SUPPORT"], "hardship.handle")).toBe(true);
    expect(hasCapability(["SUPPORT"], "holds.manage")).toBe(false);
  });
});
