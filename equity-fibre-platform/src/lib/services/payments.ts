/**
 * Payments service. Fulfilment is webhook-driven and idempotent:
 * - Each provider event id is stored exactly once (PaymentEvent.externalId
 *   unique + WebhookEvent unique) so a duplicate webhook cannot double-charge
 *   or double-transition.
 * - Only provider references are stored — never card data.
 */
import { prisma } from "@/lib/db";
import { getBusinessConfig } from "./config";
import { modemContribution } from "@/lib/domain/pricing";
import { getPaymentProvider } from "@/lib/providers/factory";
import { recordAudit } from "./audit";
import { idempotencyKey } from "@/lib/ids";
import { onModemPaymentConfirmed, transitionSubscription } from "./orders";
import { sendNotification } from "./notifications";
import { assertWorkflowEnabled } from "./killSwitch";

export async function createModemCheckout(orderId: string) {
  await assertWorkflowEnabled("modem_payments");
  const cfg = await getBusinessConfig();
  const amount = modemContribution(cfg).customerContributionCents;

  // Reuse an existing pending txn (idempotent checkout).
  let txn = await prisma.paymentTransaction.findFirst({
    where: { serviceOrderId: orderId, kind: "modem_upfront", status: "pending" },
  });
  if (!txn) {
    txn = await prisma.paymentTransaction.create({
      data: { serviceOrderId: orderId, kind: "modem_upfront", amountCents: amount, status: "pending" },
    });
  }
  const session = await getPaymentProvider().createCheckout({
    serviceOrderId: orderId,
    kind: "modem_upfront",
    amountCents: amount,
    currency: "NZD",
    idempotencyKey: idempotencyKey("modem", txn.id),
  });
  return { transactionId: txn.id, amountCents: amount, redirectUrl: session.redirectUrl };
}

export interface WebhookResult {
  status: "processed" | "duplicate_ignored";
  outcome?: string;
}

/**
 * Handle a payment webhook. `rawBody` MUST be the exact bytes the provider
 * signed. Signature verification + idempotency happen here.
 */
export async function handlePaymentWebhook(
  rawBody: string,
  signature: string | null,
): Promise<WebhookResult> {
  const parsed = getPaymentProvider().parseWebhook(rawBody, signature);

  // Idempotency guard #1: WebhookEvent unique on (provider, externalId).
  const existingWebhook = await prisma.webhookEvent.findUnique({
    where: { provider_externalId: { provider: "mock-payment", externalId: parsed.externalEventId } },
  });
  if (existingWebhook?.processed) {
    return { status: "duplicate_ignored" };
  }
  if (!existingWebhook) {
    await prisma.webhookEvent.create({
      data: {
        provider: "mock-payment",
        externalId: parsed.externalEventId,
        eventType: `payment.${parsed.outcome}`,
        signatureOk: true,
      },
    });
  }

  const txn = await prisma.paymentTransaction.findFirstOrThrow({
    where: { id: parsed.transactionRef },
  });

  // Idempotency guard #2: PaymentEvent unique on externalId.
  try {
    await prisma.paymentEvent.create({
      data: {
        transactionId: txn.id,
        externalId: parsed.externalEventId,
        type: `payment.${parsed.outcome}`,
        detail: `Mock payment ${parsed.outcome}`,
      },
    });
  } catch {
    // Unique violation => already processed this exact event.
    await markWebhookProcessed(parsed.externalEventId);
    return { status: "duplicate_ignored" };
  }

  const newStatus =
    parsed.outcome === "succeeded"
      ? "succeeded"
      : parsed.outcome === "failed"
        ? "failed"
        : parsed.outcome === "refunded"
          ? "refunded"
          : "abandoned";

  await prisma.paymentTransaction.update({
    where: { id: txn.id },
    data: { status: newStatus, providerRef: parsed.externalEventId },
  });
  await recordAudit({
    type: "payment.event",
    actorLabel: "payment-provider",
    targetType: "transaction",
    targetId: txn.id,
    metadata: { kind: txn.kind, outcome: parsed.outcome, amountCents: txn.amountCents },
  });

  // Drive downstream state on success.
  if (parsed.outcome === "succeeded" && txn.kind === "modem_upfront") {
    await onModemPaymentConfirmed(txn.serviceOrderId, "payment-provider");
    await sendNotification(txn.serviceOrderId, "modem_payment_received", "Your modem payment was received");
  }
  if (parsed.outcome === "failed") {
    await sendNotification(txn.serviceOrderId, "modem_payment_failed", "We couldn't process your payment");
  }

  await markWebhookProcessed(parsed.externalEventId);
  return { status: "processed", outcome: parsed.outcome };
}

async function markWebhookProcessed(externalId: string) {
  await prisma.webhookEvent.updateMany({
    where: { provider: "mock-payment", externalId },
    data: { processed: true },
  });
}

/**
 * Simulate a monthly charge on an active subscription (Scenario G).
 * A single failure enters grace — it must NOT suspend unless policy enables it.
 */
export async function simulateMonthlyCharge(
  orderId: string,
  outcome: "succeeded" | "failed",
  actorLabel: string,
) {
  const cfg = await getBusinessConfig();
  const sub = await prisma.subscription.findUniqueOrThrow({ where: { serviceOrderId: orderId } });
  const txn = await prisma.paymentTransaction.create({
    data: {
      serviceOrderId: orderId,
      kind: "monthly",
      amountCents: sub.monthlyPriceCents,
      status: outcome,
    },
  });
  await recordAudit({
    type: "payment.monthly",
    actorLabel,
    targetType: "transaction",
    targetId: txn.id,
    metadata: { outcome, amountCents: sub.monthlyPriceCents },
  });

  if (outcome === "failed") {
    if (sub.status === "ACTIVE") {
      await transitionSubscription(orderId, "PAST_DUE", actorLabel, "Monthly payment failed");
      await transitionSubscription(orderId, "GRACE_PERIOD", actorLabel, `Grace period (${cfg.billing.gracePeriodDays} days)`);
    }
    await prisma.billingFailure.create({
      data: { subscriptionId: sub.id, reason: "Monthly payment failed (mock)" },
    });
    await sendNotification(orderId, "monthly_payment_failed", "Payment issue — action needed");
    // Suspension requires an explicitly enabled, reviewed policy.
    if (cfg.billing.suspendOnSingleFailure) {
      await transitionSubscription(orderId, "SUSPENDED", actorLabel, "Policy: suspend on single failure");
    }
  } else {
    // Recovery path.
    if (sub.status === "GRACE_PERIOD" || sub.status === "PAST_DUE") {
      await transitionSubscription(orderId, "ACTIVE", actorLabel, "Payment recovered");
      await prisma.billingFailure.updateMany({
        where: { subscriptionId: sub.id, recoveredAt: null },
        data: { recoveredAt: new Date() },
      });
    }
  }
  return txn;
}

/** Refund (finance-only action; caller enforces capability). */
export async function refundTransaction(transactionId: string, actorLabel: string, reason: string) {
  const txn = await prisma.paymentTransaction.update({
    where: { id: transactionId },
    data: { status: "refunded" },
  });
  await recordAudit({
    type: "payment.refund",
    actorLabel,
    targetType: "transaction",
    targetId: transactionId,
    reason,
    metadata: { amountCents: txn.amountCents },
  });
  return txn;
}
