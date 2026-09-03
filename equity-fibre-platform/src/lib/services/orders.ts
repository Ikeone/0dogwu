/**
 * Service-order lifecycle + subscription transitions and the orchestration that
 * ties payment -> modem assignment -> provisioning -> shipment -> activation ->
 * billing together. All transitions are guarded and audited.
 */
import { prisma } from "@/lib/db";
import { assertTransition } from "@/lib/domain/stateMachine";
import { ORDER_TRANSITIONS, type OrderState } from "@/lib/domain/orderState";
import { DEVICE_TRANSITIONS, type DeviceState } from "@/lib/domain/deviceState";
import {
  SUBSCRIPTION_TRANSITIONS,
  type SubscriptionState,
} from "@/lib/domain/subscriptionState";
import { shouldStartMonthlyBilling } from "@/lib/domain/billing";
import { getBusinessConfig } from "./config";
import { monthlyPrice } from "@/lib/domain/pricing";
import { recordAudit } from "./audit";
import { humanRef, idempotencyKey } from "@/lib/ids";

export async function createServiceOrderForApplication(applicationId: string) {
  const existing = await prisma.serviceOrder.findUnique({ where: { applicationId } });
  if (existing) return existing;

  const cfg = await getBusinessConfig();
  const order = await prisma.serviceOrder.create({
    data: {
      reference: humanRef("SO"),
      applicationId,
      planCode: cfg.plan.code,
      status: "AWAITING_MODEM_PAYMENT",
      modemPaymentTrigger: cfg.billing.modemPaymentTrigger,
      monthlyBillingTrigger: cfg.billing.monthlyBillingTrigger,
    },
  });
  await prisma.subscription.create({
    data: {
      serviceOrderId: order.id,
      status: "NOT_CREATED",
      monthlyPriceCents: monthlyPrice(cfg).consumerPriceCents,
    },
  });
  await recordAudit({
    type: "order.created",
    actorLabel: "system",
    targetType: "order",
    targetId: order.id,
    metadata: { reference: order.reference, status: order.status },
  });
  return order;
}

export async function transitionOrder(
  orderId: string,
  to: OrderState,
  actorLabel: string,
  reason?: string,
) {
  const order = await prisma.serviceOrder.findUniqueOrThrow({ where: { id: orderId } });
  assertTransition("order", ORDER_TRANSITIONS, order.status as OrderState, to);
  await prisma.serviceOrder.update({
    where: { id: orderId },
    data: { status: to, ...(to === "ACTIVE" ? { activatedAt: new Date() } : {}) },
  });
  await recordAudit({
    type: "order.transition",
    actorLabel,
    targetType: "order",
    targetId: orderId,
    reason,
    metadata: { from: order.status, to },
  });
}

export async function transitionSubscription(
  serviceOrderId: string,
  to: SubscriptionState,
  actorLabel: string,
  reason?: string,
) {
  const sub = await prisma.subscription.findUniqueOrThrow({ where: { serviceOrderId } });
  assertTransition("subscription", SUBSCRIPTION_TRANSITIONS, sub.status as SubscriptionState, to);
  const cfg = await getBusinessConfig();
  const data: Record<string, unknown> = { status: to };
  if (to === "ACTIVE" && !sub.startedAt) {
    data.startedAt = new Date();
    data.nextBillingAt = new Date(Date.now() + 30 * 86400_000);
  }
  await prisma.subscription.update({ where: { serviceOrderId }, data });
  await recordAudit({
    type: "subscription.transition",
    actorLabel,
    targetType: "subscription",
    targetId: sub.id,
    reason,
    metadata: { from: sub.status, to, gracePeriodDays: cfg.billing.gracePeriodDays },
  });
}

/**
 * Called when the upfront modem payment is confirmed. Reserves a modem
 * atomically, attaches identifiers, enqueues a provisioning job and creates a
 * shipment. Idempotent: safe to call twice for the same order.
 */
export async function onModemPaymentConfirmed(orderId: string, actorLabel: string) {
  const order = await prisma.serviceOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { assignment: true, provisioning: true, shipment: true, application: { include: { address: true } } },
  });

  if (order.status === "AWAITING_MODEM_PAYMENT") {
    await transitionOrder(orderId, "MODEM_PAYMENT_CONFIRMED", actorLabel, "Upfront modem payment confirmed");
  }

  // Assign a modem (atomic) if not already assigned.
  const { assignModemToOrder } = await import("./modems");
  if (!order.assignment) {
    await assignModemToOrder(orderId, actorLabel);
  }

  // Move to ready-for-provisioning and enqueue the provisioning job.
  const refreshed = await prisma.serviceOrder.findUniqueOrThrow({ where: { id: orderId } });
  if (refreshed.status === "MODEM_PAYMENT_CONFIRMED") {
    await transitionOrder(orderId, "READY_FOR_PROVISIONING", actorLabel);
  }

  await enqueueProvisioningJob(orderId);
  await createShipmentForOrder(orderId, actorLabel);
}

/** Determine whether the demo should inject a transient provisioning failure. */
async function shouldInjectFailure(orderId: string): Promise<boolean> {
  const app = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { application: true },
  });
  return app?.application.scenarioTag === "F";
}

export async function enqueueProvisioningJob(orderId: string) {
  const existing = await prisma.provisioningRequest.findUnique({ where: { serviceOrderId: orderId } });
  const correlationId = existing?.correlationId ?? `prov_${orderId}`;
  if (!existing) {
    await prisma.provisioningRequest.create({
      data: { serviceOrderId: orderId, status: "PENDING", correlationId },
    });
  }
  const order = await prisma.serviceOrder.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status === "READY_FOR_PROVISIONING") {
    await transitionOrder(orderId, "PROVISIONING_REQUESTED", "system", "Provisioning job enqueued");
  }
  const failFirstAttempt = await shouldInjectFailure(orderId);
  await prisma.integrationJob.upsert({
    where: { idempotencyKey: idempotencyKey("provisioning.create", orderId) },
    update: {},
    create: {
      type: "provisioning.create",
      status: "PENDING",
      payloadJson: JSON.stringify({ serviceOrderId: orderId, failFirstAttempt }),
      correlationId,
      idempotencyKey: idempotencyKey("provisioning.create", orderId),
      maxAttempts: (await getBusinessConfig()).billing.autoRetryLimit,
    },
  });
  await recordAudit({
    type: "provisioning.requested",
    actorLabel: "system",
    targetType: "order",
    targetId: orderId,
    correlationId,
    metadata: { failFirstAttempt },
  });
}

export async function createShipmentForOrder(orderId: string, actorLabel: string) {
  const existing = await prisma.shipment.findUnique({ where: { serviceOrderId: orderId } });
  if (existing) return existing;
  const { getShippingProvider } = await import("@/lib/providers/factory");
  const order = await prisma.serviceOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { application: { include: { address: true } } },
  });
  const result = await getShippingProvider().createShipment({
    serviceOrderId: orderId,
    addressLine: order.application.address.line1,
    idempotencyKey: idempotencyKey("shipping.create", orderId),
  });
  const shipment = await prisma.shipment.create({
    data: {
      serviceOrderId: orderId,
      carrier: result.carrier,
      trackingRef: result.trackingRef,
      status: "CREATED",
    },
  });
  await prisma.shipmentEvent.create({
    data: { shipmentId: shipment.id, status: "CREATED", detail: "Shipment created" },
  });
  await recordAudit({
    type: "shipment.created",
    actorLabel,
    targetType: "shipment",
    targetId: shipment.id,
    metadata: { tracking: result.trackingRef, carrier: result.carrier },
  });
  return shipment;
}

/** Activate the service and start monthly billing per the configured trigger. */
export async function activateService(orderId: string, actorLabel: string) {
  const order = await prisma.serviceOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { assignment: { include: { device: true } } },
  });
  if (order.status !== "READY_FOR_ACTIVATION") {
    throw new Error(`Order ${order.reference} is not ready for activation (status ${order.status}).`);
  }
  await transitionOrder(orderId, "ACTIVE", actorLabel, "Service activated");

  // Device DELIVERED -> ASSIGNED -> ACTIVE at activation (installed & live).
  if (order.assignment) {
    const { transitionDevice } = await import("./modems");
    const device = await prisma.modemDevice.findUnique({ where: { id: order.assignment.deviceId } });
    if (device) {
      if (device.status === "DELIVERED") {
        await transitionDevice(order.assignment.deviceId, "ASSIGNED", actorLabel, "Modem installed");
      }
      const refreshed = await prisma.modemDevice.findUniqueOrThrow({ where: { id: order.assignment.deviceId } });
      const allowed = DEVICE_TRANSITIONS[refreshed.status as DeviceState] ?? [];
      if (allowed.includes("ACTIVE")) {
        await transitionDevice(order.assignment.deviceId, "ACTIVE", actorLabel, "Service activated");
      }
    }
  }

  const cfg = await getBusinessConfig();
  if (shouldStartMonthlyBilling("SERVICE_ACTIVATED", cfg)) {
    await startBilling(orderId, actorLabel, "Service activation");
  }
  await recordAudit({
    type: "service.activated",
    actorLabel,
    targetType: "order",
    targetId: orderId,
  });
}

export async function startBilling(orderId: string, actorLabel: string, trigger: string) {
  const sub = await prisma.subscription.findUniqueOrThrow({ where: { serviceOrderId: orderId } });
  if (sub.status === "NOT_CREATED") {
    await transitionSubscription(orderId, "PENDING_ACTIVATION", actorLabel, trigger);
  }
  await transitionSubscription(orderId, "ACTIVE", actorLabel, trigger);
  await recordAudit({
    type: "billing.started",
    actorLabel,
    targetType: "subscription",
    targetId: sub.id,
    reason: trigger,
  });
}
