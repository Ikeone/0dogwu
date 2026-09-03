import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { reconcileStuckJobs } from "@/lib/services/reconciliation";

describe("reconciliation: crash recovery for stuck jobs", () => {
  it("returns a RUNNING job past its lease back to PENDING", async () => {
    const job = await prisma.integrationJob.create({
      data: {
        type: "provisioning.create",
        status: "RUNNING",
        payloadJson: JSON.stringify({ serviceOrderId: "x" }),
        correlationId: `rec_${Date.now()}`,
        idempotencyKey: `rec_${Date.now()}_${Math.random()}`,
        attempts: 1,
      },
    });
    // Negative lease => treat any RUNNING job as past-lease (deterministic test).
    const count = await reconcileStuckJobs(-1);
    expect(count).toBeGreaterThanOrEqual(1);
    const refreshed = await prisma.integrationJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(refreshed.status).toBe("PENDING");
  });

  it("leaves fresh RUNNING jobs alone under a normal lease", async () => {
    const job = await prisma.integrationJob.create({
      data: {
        type: "provisioning.create",
        status: "RUNNING",
        payloadJson: "{}",
        correlationId: `rec2_${Date.now()}`,
        idempotencyKey: `rec2_${Date.now()}_${Math.random()}`,
      },
    });
    await reconcileStuckJobs(15);
    const refreshed = await prisma.integrationJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(refreshed.status).toBe("RUNNING");
  });
});
