/**
 * Business configuration service.
 *
 * Merges the code-defined DEFAULT_BUSINESS_CONFIG with administrator overrides
 * stored in SystemConfiguration. Only RUNTIME_CONFIG_KEYS may be overridden.
 * Every change records old/new value, user, time, and reason (ConfigurationChange).
 */
import { prisma } from "@/lib/db";
import {
  DEFAULT_BUSINESS_CONFIG,
  type BusinessConfig,
} from "@/lib/config/business";
import { recordAudit } from "./audit";

/** Deep-ish clone so callers never mutate the default object. */
function cloneConfig(): BusinessConfig {
  return JSON.parse(JSON.stringify(DEFAULT_BUSINESS_CONFIG)) as BusinessConfig;
}

export async function getBusinessConfig(): Promise<BusinessConfig> {
  const cfg = cloneConfig();
  const rows = await prisma.systemConfiguration.findMany();
  for (const row of rows) {
    applyOverride(cfg, row.key, safeParse(row.valueJson));
  }
  return cfg;
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function applyOverride(cfg: BusinessConfig, key: string, value: unknown): void {
  if (value === undefined) return;
  switch (key) {
    case "eligibility.enabledHousingCategories":
      cfg.eligibility.enabledHousingCategories = value as never;
      break;
    case "eligibility.enabledEvidenceTypes":
      cfg.eligibility.enabledEvidenceTypes = value as never;
      break;
    case "eligibility.inactivityDays":
      cfg.eligibility.inactivityDays = Number(value);
      break;
    case "billing.modemPaymentTrigger":
      cfg.billing.modemPaymentTrigger = value as never;
      break;
    case "billing.monthlyBillingTrigger":
      cfg.billing.monthlyBillingTrigger = value as never;
      break;
    case "billing.gracePeriodDays":
      cfg.billing.gracePeriodDays = Number(value);
      break;
    case "billing.suspendOnSingleFailure":
      cfg.billing.suspendOnSingleFailure = Boolean(value);
      break;
    case "modem.deductChorusContribution":
      cfg.modem.deductChorusContribution = Boolean(value);
      break;
    default:
      break;
  }
}

export async function setConfigValue(
  key: string,
  value: unknown,
  changedBy: string,
  reason: string,
): Promise<void> {
  const existing = await prisma.systemConfiguration.findUnique({ where: { key } });
  const newValue = JSON.stringify(value);
  if (existing) {
    await prisma.configurationChange.create({
      data: {
        configId: existing.id,
        oldValue: existing.valueJson,
        newValue,
        changedBy,
        reason,
      },
    });
    await prisma.systemConfiguration.update({
      where: { key },
      data: { valueJson: newValue },
    });
  } else {
    const created = await prisma.systemConfiguration.create({
      data: { key, valueJson: newValue },
    });
    await prisma.configurationChange.create({
      data: {
        configId: created.id,
        oldValue: "(default)",
        newValue,
        changedBy,
        reason,
      },
    });
  }
  await recordAudit({
    type: "configuration.changed",
    actorLabel: changedBy,
    targetType: "config",
    targetId: key,
    reason,
    metadata: { key },
  });
}
