import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db";
import { submitApplication } from "@/lib/services/applications";
import { createModemCheckout, handlePaymentWebhook } from "@/lib/services/payments";
import { signMockWebhook } from "@/lib/providers/mock/payment";

async function makeEligibleOrder(tag: string) {
  const res = await submitApplication({
    placeRef: "PLACE-ELIGIBLE-99",
    addressLine: `1 Test ${tag} Way`,
    suburb: "Testville",
    city: "Demoville",
    postcode: "7999",
    housingCategory: "public_housing",
    evidenceType: "community_services_card",
    evidenceProvided: true,
    contactName: `Test ${tag}`,
    contactEmail: `test.${tag}@demo.nz`,
    serviceConsent: true,
    marketingConsent: false,
    policyVersion: "v1.0-test",
    scenarioTag: "IT",
  });
  expect(res.decision.outcome).toBe("ELIGIBLE");
  return res.serviceOrderId!;
}

describe("payment webhook idempotency", () => {
  let orderId: string;
  let txnId: string;
  const externalEventId = `evt_test_${Date.now()}`;

  beforeAll(async () => {
    orderId = await makeEligibleOrder(`wh${Date.now()}`);
    const checkout = await createModemCheckout(orderId);
    txnId = checkout.transactionId;
  });

  it("processes once and ignores a duplicate delivery (no double-charge / double-transition)", async () => {
    const body = JSON.stringify({ externalEventId, transactionRef: txnId, outcome: "succeeded" });
    const sig = signMockWebhook(body);

    const first = await handlePaymentWebhook(body, sig);
    expect(first.status).toBe("processed");

    const second = await handlePaymentWebhook(body, sig);
    expect(second.status).toBe("duplicate_ignored");

    // Exactly one PaymentEvent for this external id.
    const events = await prisma.paymentEvent.findMany({ where: { externalId: externalEventId } });
    expect(events).toHaveLength(1);

    // The order advanced past AWAITING_MODEM_PAYMENT exactly once and a modem was assigned once.
    const order = await prisma.serviceOrder.findUniqueOrThrow({ where: { id: orderId }, include: { assignment: true } });
    expect(order.status).not.toBe("AWAITING_MODEM_PAYMENT");
    expect(order.assignment).not.toBeNull();

    const succeeded = await prisma.paymentTransaction.findMany({
      where: { serviceOrderId: orderId, kind: "modem_upfront", status: "succeeded" },
    });
    expect(succeeded).toHaveLength(1);
  });

  it("rejects a webhook with a bad signature", async () => {
    const body = JSON.stringify({ externalEventId: "evt_bad", transactionRef: txnId, outcome: "succeeded" });
    await expect(handlePaymentWebhook(body, "not-a-valid-signature")).rejects.toThrow();
  });
});
