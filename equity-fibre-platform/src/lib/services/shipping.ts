/**
 * Shipment progression. Advancing a shipment also advances the linked device
 * state (PACKED/SHIPPED/DELIVERED). Delivery does NOT start monthly billing
 * unless the billing trigger is MODEM_DELIVERY.
 */
import { prisma } from "@/lib/db";
import { getBusinessConfig } from "./config";
import { shouldStartMonthlyBilling } from "@/lib/domain/billing";
import { recordAudit } from "./audit";
import { transitionDevice } from "./modems";
import { startBilling } from "./orders";
import { sendNotification } from "./notifications";

export type ShipmentStage = "PACKED" | "SHIPPED" | "DELIVERED" | "FAILED";

const DEVICE_FOR_STAGE: Record<Exclude<ShipmentStage, "FAILED">, "PACKED" | "SHIPPED" | "DELIVERED"> = {
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
};

export async function advanceShipment(orderId: string, stage: ShipmentStage, actorLabel: string) {
  const shipment = await prisma.shipment.findUniqueOrThrow({
    where: { serviceOrderId: orderId },
    include: { serviceOrder: { include: { assignment: true } } },
  });

  await prisma.shipment.update({ where: { id: shipment.id }, data: { status: stage } });
  await prisma.shipmentEvent.create({
    data: { shipmentId: shipment.id, status: stage, detail: `Shipment ${stage.toLowerCase()}` },
  });
  await recordAudit({
    type: "shipment.progress",
    actorLabel,
    targetType: "shipment",
    targetId: shipment.id,
    metadata: { stage, tracking: shipment.trackingRef },
  });

  // Advance the device state to match, stepping through intermediate states so
  // skipping a stage (e.g. delivered without an explicit "packed") stays valid.
  const assignment = shipment.serviceOrder.assignment;
  if (assignment && stage !== "FAILED") {
    const deviceTarget = DEVICE_FOR_STAGE[stage];
    await advanceDeviceThroughShipping(assignment.deviceId, deviceTarget, actorLabel, stage);
  }

  if (stage === "DELIVERED") {
    await sendNotification(orderId, "modem_delivered", "Your modem has been delivered");
    const cfg = await getBusinessConfig();
    if (shouldStartMonthlyBilling("MODEM_DELIVERED", cfg)) {
      await startBilling(orderId, actorLabel, "Modem delivery (configured trigger)");
    }
  }
}

/** Ordered device path during fulfilment. */
const SHIPPING_DEVICE_PATH = ["RESERVED", "PACKED", "SHIPPED", "DELIVERED"] as const;

async function advanceDeviceThroughShipping(
  deviceId: string,
  target: "PACKED" | "SHIPPED" | "DELIVERED",
  actorLabel: string,
  stage: string,
) {
  const targetIdx = SHIPPING_DEVICE_PATH.indexOf(target);
  for (let guard = 0; guard < SHIPPING_DEVICE_PATH.length; guard++) {
    const device = await prisma.modemDevice.findUnique({ where: { id: deviceId } });
    if (!device) return;
    const currentIdx = SHIPPING_DEVICE_PATH.indexOf(device.status as (typeof SHIPPING_DEVICE_PATH)[number]);
    if (currentIdx === -1 || currentIdx >= targetIdx) return; // not on path or already there
    const next = SHIPPING_DEVICE_PATH[currentIdx + 1]!;
    await transitionDevice(deviceId, next, actorLabel, `Shipment ${stage}`);
  }
}
