/**
 * Demo control actions. These map admin "simulate external event" buttons to
 * real service transitions. Only available when DEMO_MODE=true (enforced by the
 * API route). They exercise the same code paths a real webhook would.
 */
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { signMockWebhook } from "@/lib/providers/mock/payment";
import { handlePaymentWebhook, simulateMonthlyCharge } from "./payments";
import { processDueJobs } from "./provisioning";
import { advanceShipment } from "./shipping";
import { activateService, transitionOrder, transitionSubscription } from "./orders";
import { randomUUID } from "node:crypto";

export const DEMO_EVENTS = [
  "chorus_eligibility_success",
  "chorus_eligibility_failure",
  "provisioning_started",
  "provisioning_delayed",
  "provisioning_completed",
  "payment_successful",
  "payment_failed",
  "modem_packed",
  "modem_shipped",
  "modem_delivered",
  "service_activated",
  "service_suspended",
  "monthly_payment_success",
  "monthly_payment_failure",
  "process_jobs",
] as const;

export type DemoEvent = (typeof DEMO_EVENTS)[number];

export function assertDemoMode() {
  if (!getEnv().DEMO_MODE) {
    throw new Error("Demo controls are disabled because DEMO_MODE is not true.");
  }
}

/** Build + sign a mock payment webhook body and process it (real code path). */
async function firePaymentWebhook(
  orderId: string,
  outcome: "succeeded" | "failed",
) {
  const txn = await prisma.paymentTransaction.findFirstOrThrow({
    where: { serviceOrderId: orderId, kind: "modem_upfront" },
    orderBy: { createdAt: "desc" },
  });
  const body = JSON.stringify({
    externalEventId: `evt_${randomUUID()}`,
    transactionRef: txn.id,
    outcome,
  });
  const sig = signMockWebhook(body);
  return handlePaymentWebhook(body, sig);
}

/**
 * "Run the queue now": a manual demo affordance. Resets due-time for PENDING
 * jobs so each click deterministically processes one more attempt (the real
 * worker uses proper exponential backoff instead).
 */
async function runQueueNow() {
  await prisma.integrationJob.updateMany({
    where: { status: "PENDING" },
    data: { nextRunAt: new Date() },
  });
  return processDueJobs(20);
}

export async function runDemoEvent(event: DemoEvent, orderId: string, actor: string) {
  assertDemoMode();
  switch (event) {
    case "payment_successful":
      return firePaymentWebhook(orderId, "succeeded");
    case "payment_failed":
      return firePaymentWebhook(orderId, "failed");
    case "process_jobs":
    case "provisioning_started":
    case "provisioning_completed":
    case "provisioning_delayed":
      return runQueueNow();
    case "modem_packed":
      return advanceShipment(orderId, "PACKED", actor);
    case "modem_shipped":
      return advanceShipment(orderId, "SHIPPED", actor);
    case "modem_delivered":
      return advanceShipment(orderId, "DELIVERED", actor);
    case "service_activated":
      return activateService(orderId, actor);
    case "service_suspended": {
      await transitionOrder(orderId, "SUSPENDED", actor, "Demo: service suspended");
      await transitionSubscription(orderId, "SUSPENDED", actor, "Demo: service suspended").catch(() => undefined);
      return { ok: true };
    }
    case "monthly_payment_success":
      return simulateMonthlyCharge(orderId, "succeeded", actor);
    case "monthly_payment_failure":
      return simulateMonthlyCharge(orderId, "failed", actor);
    case "chorus_eligibility_success":
    case "chorus_eligibility_failure":
      // These are illustrative provider webhooks; in the demo the deterministic
      // engine already decided eligibility at submission time.
      return { ok: true, note: "Eligibility is decided deterministically at submission in the demo." };
    default: {
      const _exhaustive: never = event;
      throw new Error(`Unhandled demo event: ${String(_exhaustive)}`);
    }
  }
}
