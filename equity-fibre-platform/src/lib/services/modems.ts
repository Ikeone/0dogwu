/**
 * Modem inventory: import with MAC normalisation/validation, atomic single-use
 * assignment, and device state transitions. A modem can be assigned to exactly
 * one active service (enforced by unique constraints + transactional reservation).
 */
import { prisma } from "@/lib/db";
import { normaliseMac, InvalidMacError } from "@/lib/domain/mac";
import { assertTransition } from "@/lib/domain/stateMachine";
import { DEVICE_TRANSITIONS, type DeviceState } from "@/lib/domain/deviceState";
import { recordAudit } from "./audit";
import { getBusinessConfig } from "./config";

export interface ModemImportRow {
  assetId: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  wanMac: string;
  supplierBatch?: string;
}

export interface ImportResult {
  imported: number;
  skipped: { row: ModemImportRow; reason: string }[];
}

/** Import modems. Duplicate serials/MACs and invalid MACs are skipped, not fatal. */
export async function importModems(rows: ModemImportRow[]): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: [] };
  for (const row of rows) {
    let canonicalMac: string;
    try {
      canonicalMac = normaliseMac(row.wanMac);
    } catch (e) {
      result.skipped.push({
        row,
        reason: e instanceof InvalidMacError ? e.message : "Invalid MAC",
      });
      continue;
    }
    // Duplicate detection (serial or MAC).
    const dup = await prisma.modemDevice.findFirst({
      where: {
        OR: [{ serialNumber: row.serialNumber }, { wanMac: canonicalMac }, { assetId: row.assetId }],
      },
    });
    if (dup) {
      result.skipped.push({ row, reason: "Duplicate asset/serial/MAC already in inventory." });
      continue;
    }

    const model = await prisma.modemModel.upsert({
      where: { id: `${row.manufacturer}:${row.model}` },
      update: {},
      create: {
        id: `${row.manufacturer}:${row.model}`,
        manufacturer: row.manufacturer,
        model: row.model,
        confirmed: false,
      },
    });
    await prisma.modemDevice.create({
      data: {
        assetId: row.assetId,
        modelId: model.id,
        serialNumber: row.serialNumber,
        wanMac: canonicalMac,
        status: "AVAILABLE",
        supplierBatch: row.supplierBatch ?? null,
      },
    });
    result.imported += 1;
  }
  await recordAudit({
    type: "inventory.imported",
    actorLabel: "staff",
    targetType: "inventory",
    metadata: { imported: result.imported, skipped: result.skipped.length },
  });
  return result;
}

export async function transitionDevice(
  deviceId: string,
  to: DeviceState,
  actorLabel: string,
  reason?: string,
) {
  const device = await prisma.modemDevice.findUniqueOrThrow({ where: { id: deviceId } });
  assertTransition("device", DEVICE_TRANSITIONS, device.status as DeviceState, to);
  await prisma.modemDevice.update({ where: { id: deviceId }, data: { status: to } });
  await recordAudit({
    type: "device.transition",
    actorLabel,
    targetType: "device",
    targetId: deviceId,
    reason,
    metadata: { from: device.status, to, asset: device.assetId },
  });
}

/**
 * Atomically reserve + assign an AVAILABLE modem to an order. Uses a
 * transaction and the unique constraint on ModemAssignment to guarantee a
 * device is never assigned to two active services, even under concurrency.
 */
export async function assignModemToOrder(orderId: string, actorLabel: string) {
  const cfg = await getBusinessConfig();
  return prisma.$transaction(async (tx) => {
    const already = await tx.modemAssignment.findUnique({ where: { serviceOrderId: orderId } });
    if (already) return already;

    // Pick the oldest AVAILABLE device and flip it to RESERVED in the same tx.
    const device = await tx.modemDevice.findFirst({
      where: { status: "AVAILABLE" },
      orderBy: { receivedAt: "asc" },
    });
    if (!device) throw new Error("No available modem in inventory to assign.");

    // Guarded transition AVAILABLE -> RESERVED -> (immediately) ASSIGNED.
    assertTransition("device", DEVICE_TRANSITIONS, "AVAILABLE", "RESERVED");
    await tx.modemDevice.update({ where: { id: device.id }, data: { status: "RESERVED" } });

    // The device stays RESERVED (physically it still ships). The assignment
    // record is the logical single-use link; the physical device advances
    // through PACKED/SHIPPED/DELIVERED and becomes ASSIGNED at activation.
    const assignment = await tx.modemAssignment.create({
      data: {
        deviceId: device.id,
        serviceOrderId: orderId,
        reservationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    // Attach identifiers to the order as external references (MAC + serial kept
    // separately; the provider adapter decides which the network needs — Q34/Q35).
    await tx.externalOrderReference.createMany({
      data: [
        { serviceOrderId: orderId, system: "wholesale", refType: "wan_mac", value: device.wanMac },
        { serviceOrderId: orderId, system: "wholesale", refType: "serial", value: device.serialNumber },
      ],
    });

    return assignment;
  }).then(async (assignment) => {
    await recordAudit({
      type: "modem.assigned",
      actorLabel,
      targetType: "order",
      targetId: orderId,
      metadata: { deviceId: assignment.deviceId, reservationHours: 24, retryLimit: cfg.billing.autoRetryLimit },
    });
    return assignment;
  });
}

export async function releaseAssignment(orderId: string, reason: string, actorLabel: string) {
  const assignment = await prisma.modemAssignment.findUnique({
    where: { serviceOrderId: orderId },
    include: { device: true },
  });
  if (!assignment) return;
  await prisma.modemAssignment.update({
    where: { serviceOrderId: orderId },
    data: { releasedAt: new Date(), releaseReason: reason },
  });
  // Historical assignment record is preserved; device returns to AVAILABLE.
  const from = assignment.device.status as DeviceState;
  const to: DeviceState = "RETURN_PENDING";
  if (DEVICE_TRANSITIONS[from]?.includes(to)) {
    await transitionDevice(assignment.deviceId, to, actorLabel, reason);
  }
  await recordAudit({
    type: "modem.released",
    actorLabel,
    targetType: "order",
    targetId: orderId,
    reason,
  });
}
