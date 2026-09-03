/**
 * Standalone background worker process.
 *
 * Polls the durable IntegrationJob queue and processes due jobs (provisioning
 * creation + retries). This is the "separate worker process" of the modular
 * monolith. In the demo it can also be driven synchronously via the admin
 * "process queue" control, so a long-running worker is optional for the demo.
 *
 * Run:  npm run worker
 */
import { processDueJobs } from "@/lib/services/provisioning";
import { reconcileStuckJobs, reconcileStuckProvisioning } from "@/lib/services/reconciliation";
import { logProviderStartup } from "@/lib/providers/factory";
import { logger } from "@/lib/logger";

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 3000);
const RECONCILE_EVERY_TICKS = Number(process.env.WORKER_RECONCILE_TICKS ?? 20);

async function loop() {
  logProviderStartup();
  logger.info("worker.started", { pollMs: POLL_MS });
  let tick = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const result = await processDueJobs(20);
      if (result.processed > 0) logger.info("worker.tick", { ...result });
      // Periodic reconciliation: recover crashed leases + flag stuck orders.
      if (tick % RECONCILE_EVERY_TICKS === 0) {
        await reconcileStuckJobs();
        await reconcileStuckProvisioning();
      }
    } catch (err) {
      logger.error("worker.error", { message: err instanceof Error ? err.message : String(err) });
    }
    tick += 1;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

loop().catch((err) => {
  logger.error("worker.fatal", { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
