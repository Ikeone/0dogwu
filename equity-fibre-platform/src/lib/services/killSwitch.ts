/**
 * Operational kill switches. Each critical workflow can be paused. Changing a
 * switch is a high-risk action: it requires an authorised actor + reason and is
 * audited; in PILOT/PRODUCTION it also requires maker-checker approval (see
 * services/approvals.ts). Switches are stored in SystemConfiguration so they
 * survive restarts and are visible/auditable.
 */
import { prisma } from "@/lib/db";
import { recordAudit } from "./audit";

export const KILL_SWITCHES = [
  "accept_applications",
  "modem_payments",
  "recurring_billing",
  "chorus_orders",
  "network_activation",
  "shipping",
  "outbound_email",
  "outbound_sms",
  "ai_support",
  "lead_imports",
] as const;

export type KillSwitch = (typeof KILL_SWITCHES)[number];

const KEY_PREFIX = "killswitch.";

/** True = workflow is ENABLED (default). A switch that is "on" pauses it. */
export async function isWorkflowEnabled(sw: KillSwitch): Promise<boolean> {
  const row = await prisma.systemConfiguration.findUnique({ where: { key: `${KEY_PREFIX}${sw}` } });
  if (!row) return true;
  try {
    // Stored value is { paused: boolean, reason, expiresAt }.
    const v = JSON.parse(row.valueJson) as { paused?: boolean };
    return !v.paused;
  } catch {
    return true;
  }
}

export class WorkflowPausedError extends Error {
  constructor(public readonly sw: KillSwitch) {
    super(`Workflow '${sw}' is currently paused by an operational kill switch.`);
    this.name = "WorkflowPausedError";
  }
}

/** Throw if a workflow is paused. Call at the entry of the guarded workflow. */
export async function assertWorkflowEnabled(sw: KillSwitch): Promise<void> {
  if (!(await isWorkflowEnabled(sw))) throw new WorkflowPausedError(sw);
}

export async function setKillSwitch(
  sw: KillSwitch,
  paused: boolean,
  actorLabel: string,
  reason: string,
  expiresAt?: Date,
) {
  const key = `${KEY_PREFIX}${sw}`;
  const value = JSON.stringify({ paused, reason, expiresAt: expiresAt?.toISOString() ?? null });
  await prisma.systemConfiguration.upsert({
    where: { key },
    update: { valueJson: value },
    create: { key, valueJson: value },
  });
  await recordAudit({
    type: "killswitch.changed",
    actorLabel,
    targetType: "killswitch",
    targetId: sw,
    reason,
    metadata: { paused, expiresAt: expiresAt?.toISOString() ?? null },
  });
}

export async function listKillSwitches(): Promise<{ sw: KillSwitch; enabled: boolean }[]> {
  const results: { sw: KillSwitch; enabled: boolean }[] = [];
  for (const sw of KILL_SWITCHES) {
    results.push({ sw, enabled: await isWorkflowEnabled(sw) });
  }
  return results;
}
