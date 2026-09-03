import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { setKillSwitch, isWorkflowEnabled, assertWorkflowEnabled, WorkflowPausedError } from "@/lib/services/killSwitch";
import { createModemCheckout } from "@/lib/services/payments";
import { submitApplication } from "@/lib/services/applications";

async function eligibleOrder(tag: string) {
  const res = await submitApplication({
    placeRef: "PLACE-ELIGIBLE-99", addressLine: `1 KS ${tag}`, suburb: "T", city: "D", postcode: "7999",
    housingCategory: "public_housing", evidenceType: "community_services_card", evidenceProvided: true,
    contactName: `KS ${tag}`, contactEmail: `ks.${tag}@demo.nz`, serviceConsent: true, marketingConsent: false,
    policyVersion: "v1", scenarioTag: "IT",
  });
  return res.serviceOrderId!;
}

describe("kill switches", () => {
  afterAll(async () => {
    await setKillSwitch("modem_payments", false, "test", "cleanup");
    await setKillSwitch("accept_applications", false, "test", "cleanup");
  });

  it("defaults to enabled", async () => {
    await prisma.systemConfiguration.deleteMany({ where: { key: "killswitch.shipping" } });
    expect(await isWorkflowEnabled("shipping")).toBe(true);
  });

  it("pauses and resumes a workflow, and blocks the guarded action while paused", async () => {
    const orderId = await eligibleOrder(`p${Date.now()}`);
    await setKillSwitch("modem_payments", true, "tester", "incident drill");
    expect(await isWorkflowEnabled("modem_payments")).toBe(false);
    await expect(createModemCheckout(orderId)).rejects.toBeInstanceOf(WorkflowPausedError);

    await setKillSwitch("modem_payments", false, "tester", "incident resolved");
    expect(await isWorkflowEnabled("modem_payments")).toBe(true);
    const checkout = await createModemCheckout(orderId);
    expect(checkout.amountCents).toBeGreaterThan(0);
  });

  it("blocks new applications when accept_applications is paused", async () => {
    await setKillSwitch("accept_applications", true, "tester", "pause intake");
    await expect(eligibleOrder(`x${Date.now()}`)).rejects.toBeInstanceOf(WorkflowPausedError);
    await setKillSwitch("accept_applications", false, "tester", "resume intake");
  });

  it("assertWorkflowEnabled throws WorkflowPausedError for a paused switch", async () => {
    await setKillSwitch("ai_support", true, "tester", "drill");
    await expect(assertWorkflowEnabled("ai_support")).rejects.toBeInstanceOf(WorkflowPausedError);
    await setKillSwitch("ai_support", false, "tester", "drill end");
  });
});
