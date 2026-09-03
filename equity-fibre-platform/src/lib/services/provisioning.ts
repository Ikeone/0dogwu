/**
 * Integration job processor (used by both the worker process and the admin
 * "process queue" control). Handles provisioning.create with retry classification,
 * exponential backoff, attempt logging, and dead-lettering.
 *
 * The transient-failure demo (Scenario F) is driven by the job payload flag
 * `failFirstAttempt` so it works across processes and is fully observable.
 */
import { prisma } from "@/lib/db";
import { classifyError, backoffMs } from "@/lib/domain/retry";
import { getProvisioningProvider } from "@/lib/providers/factory";
import { simulateTransientProvisioningFault } from "@/lib/providers/mock/provisioning";
import { recordAudit } from "./audit";
import { transitionOrder } from "./orders";
import { logger } from "@/lib/logger";

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
}

/** Claim and process due PENDING jobs. Returns a summary. */
export async function processDueJobs(limit = 10): Promise<ProcessResult> {
  const now = new Date();
  const due = await prisma.integrationJob.findMany({
    where: { status: { in: ["PENDING"] }, nextRunAt: { lte: now } },
    orderBy: { nextRunAt: "asc" },
    take: limit,
  });
  const result: ProcessResult = { processed: 0, succeeded: 0, failed: 0, deadLettered: 0 };

  for (const job of due) {
    result.processed += 1;
    // Claim the job (optimistic — status PENDING -> RUNNING).
    const claimed = await prisma.integrationJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: { status: "RUNNING", attempts: { increment: 1 } },
    });
    if (claimed.count === 0) continue; // someone else claimed it

    const attemptNo = job.attempts + 1;
    try {
      await runJob(job.type, JSON.parse(job.payloadJson), attemptNo);
      await prisma.integrationJob.update({
        where: { id: job.id },
        data: { status: "SUCCEEDED", lastError: null },
      });
      await prisma.integrationAttempt.create({
        data: { jobId: job.id, attemptNo, outcome: "success", detail: "OK" },
      });
      result.succeeded += 1;
    } catch (err) {
      const klass = classifyError(err);
      const message = err instanceof Error ? err.message : String(err);
      await prisma.integrationAttempt.create({
        data: {
          jobId: job.id,
          attemptNo,
          outcome: klass === "retryable" ? "retryable_error" : "permanent_error",
          detail: message.slice(0, 300),
        },
      });

      const exhausted = attemptNo >= job.maxAttempts;
      if (klass === "permanent" || exhausted) {
        await prisma.integrationJob.update({
          where: { id: job.id },
          data: { status: "DEAD_LETTER", lastError: message.slice(0, 300) },
        });
        result.deadLettered += 1;
        logger.warn("job.dead_letter", { jobId: job.id, type: job.type, attemptNo });
      } else {
        await prisma.integrationJob.update({
          where: { id: job.id },
          data: {
            status: "PENDING",
            lastError: message.slice(0, 300),
            nextRunAt: new Date(Date.now() + backoffMs(attemptNo, 500, 5000)),
          },
        });
        result.failed += 1;
        logger.info("job.retry_scheduled", { jobId: job.id, type: job.type, attemptNo });
      }
    }
  }
  return result;
}

async function runJob(type: string, payload: Record<string, unknown>, attemptNo: number) {
  switch (type) {
    case "provisioning.create":
      return runProvisioning(payload as { serviceOrderId: string; failFirstAttempt?: boolean }, attemptNo);
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function runProvisioning(
  payload: { serviceOrderId: string; failFirstAttempt?: boolean },
  attemptNo: number,
) {
  const orderId = payload.serviceOrderId;
  const req = await prisma.provisioningRequest.findUniqueOrThrow({
    where: { serviceOrderId: orderId },
  });
  const order = await prisma.serviceOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { assignment: { include: { device: true } }, application: { include: { address: true } } },
  });

  // Move order + request into IN_PROGRESS.
  if (order.status === "PROVISIONING_REQUESTED" || order.status === "PROVISIONING_BLOCKED") {
    await transitionOrder(orderId, "PROVISIONING_IN_PROGRESS", "worker", `Attempt ${attemptNo}`);
  }
  await prisma.provisioningRequest.update({ where: { id: req.id }, data: { status: "IN_PROGRESS" } });
  await prisma.provisioningEvent.create({
    data: { requestId: req.id, type: "attempt", detail: `Provisioning attempt ${attemptNo}` },
  });

  // Inject a transient failure on the first attempt for Scenario F.
  if (payload.failFirstAttempt && attemptNo === 1) {
    await prisma.provisioningRequest.update({ where: { id: req.id }, data: { status: "BLOCKED" } });
    await prisma.provisioningEvent.create({
      data: { requestId: req.id, type: "error", detail: "Transient provider fault (503). Will retry." },
    });
    await transitionOrder(orderId, "PROVISIONING_BLOCKED", "worker", "Transient provider fault");
    simulateTransientProvisioningFault(); // throws RetryableError
  }

  if (!order.assignment) throw new Error("No modem assigned to order.");

  const providerResult = await getProvisioningProvider().createOrder({
    serviceOrderId: orderId,
    placeRef: order.application.address.externalPlaceRef ?? "UNKNOWN",
    planCode: order.planCode,
    wanMac: order.assignment.device.wanMac,
    serialNumber: order.assignment.device.serialNumber,
    idempotencyKey: `prov:${orderId}`,
    correlationId: req.correlationId,
  });

  await prisma.externalOrderReference.create({
    data: { serviceOrderId: orderId, system: "chorus", refType: "order_id", value: providerResult.externalOrderId },
  });
  await prisma.provisioningRequest.update({ where: { id: req.id }, data: { status: "COMPLETED" } });
  await prisma.provisioningEvent.create({
    data: { requestId: req.id, type: "completed", detail: providerResult.detail },
  });
  await transitionOrder(orderId, "READY_FOR_ACTIVATION", "worker", "Provisioning completed");
  await recordAudit({
    type: "provisioning.completed",
    actorLabel: "worker",
    targetType: "order",
    targetId: orderId,
    correlationId: req.correlationId,
    metadata: { externalOrderId: providerResult.externalOrderId, attempts: attemptNo },
  });
}

/** Retry a dead-lettered or blocked job manually (staff action). */
export async function retryJob(jobId: string, actorLabel: string) {
  const job = await prisma.integrationJob.findUniqueOrThrow({ where: { id: jobId } });
  await prisma.integrationJob.update({
    where: { id: jobId },
    data: { status: "PENDING", nextRunAt: new Date(), lastError: null },
  });
  await recordAudit({
    type: "job.manual_retry",
    actorLabel,
    targetType: "job",
    targetId: jobId,
    metadata: { type: job.type },
  });
}
