/**
 * Eligibility application service: submission, deterministic eligibility
 * evaluation, and manual-review resolution. Creates a ServiceOrder when a
 * decision is ELIGIBLE.
 */
import { prisma } from "@/lib/db";
import { assertTransition } from "@/lib/domain/stateMachine";
import {
  APPLICATION_TRANSITIONS,
  type ApplicationState,
} from "@/lib/domain/applicationState";
import {
  evaluateEligibility,
  type EligibilityInput,
} from "@/lib/domain/eligibility";
import type {
  EvidenceType,
  HousingCategory,
} from "@/lib/config/business";
import { getBusinessConfig } from "./config";
import { getAddressProvider } from "@/lib/providers/factory";
import { recordAudit } from "./audit";
import { humanRef } from "@/lib/ids";
import { createServiceOrderForApplication } from "./orders";

export interface SubmitApplicationInput {
  userId?: string | null;
  placeRef: string;
  addressLine: string;
  suburb: string;
  city: string;
  postcode: string;
  housingCategory: HousingCategory;
  evidenceType: EvidenceType;
  evidenceProvided: boolean;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  serviceConsent: boolean;
  marketingConsent: boolean;
  policyVersion: string;
  scenarioTag?: string;
  ip?: string | null;
}

export async function transitionApplication(
  id: string,
  to: ApplicationState,
  actorLabel: string,
  reason?: string,
): Promise<void> {
  const app = await prisma.eligibilityApplication.findUniqueOrThrow({ where: { id } });
  assertTransition("application", APPLICATION_TRANSITIONS, app.status as ApplicationState, to);
  await prisma.eligibilityApplication.update({
    where: { id },
    data: { status: to, ...(to === "ELIGIBLE" || to === "INELIGIBLE" ? { decidedAt: new Date() } : {}) },
  });
  await recordAudit({
    type: "application.transition",
    actorLabel,
    targetType: "application",
    targetId: id,
    reason,
    metadata: { from: app.status, to },
  });
}

export async function submitApplication(input: SubmitApplicationInput) {
  const cfg = await getBusinessConfig();
  if (!input.serviceConsent) {
    throw new Error("Service consent is required to submit an application.");
  }

  // Resolve the address + site info from the provider (mock in demo).
  const site = await getAddressProvider().getSiteInfo(input.placeRef);

  const address = await prisma.address.create({
    data: {
      line1: input.addressLine,
      suburb: input.suburb,
      city: input.city,
      postcode: input.postcode,
      externalPlaceRef: input.placeRef,
      hasOnt: site.hasOnt,
      lastActiveAt:
        site.daysSinceLastActive == null
          ? null
          : new Date(Date.now() - site.daysSinceLastActive * 86400_000),
    },
  });

  const app = await prisma.eligibilityApplication.create({
    data: {
      reference: humanRef("EF"),
      userId: input.userId ?? null,
      addressId: address.id,
      status: "SUBMITTED",
      housingCategory: input.housingCategory,
      evidenceType: input.evidenceType,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone ?? null,
      scenarioTag: input.scenarioTag ?? null,
      submittedAt: new Date(),
    },
  });

  // Consent records (no pre-ticked boxes; separate service vs marketing).
  await prisma.consentRecord.createMany({
    data: [
      {
        applicationId: app.id,
        consentType: "service",
        granted: true,
        policyVersion: input.policyVersion,
      },
      {
        applicationId: app.id,
        consentType: "marketing",
        granted: input.marketingConsent,
        policyVersion: input.policyVersion,
      },
    ],
  });

  await recordAudit({
    type: "application.submitted",
    actorLabel: input.contactName ? "customer" : "anonymous",
    targetType: "application",
    targetId: app.id,
    metadata: { reference: app.reference, scenario: input.scenarioTag ?? null },
  });

  // Evaluate deterministic eligibility.
  await transitionApplication(app.id, "CHECKING", "system", "Automatic eligibility check");

  const evalInput: EligibilityInput = {
    ontInstalled: site.hasOnt,
    daysSinceLastActive: site.daysSinceLastActive,
    providerConflict: site.indeterminate,
    housingCategory: input.housingCategory,
    evidenceType: input.evidenceType,
    evidenceProvided: input.evidenceProvided,
  };
  const decision = evaluateEligibility(evalInput, cfg);

  // Persist rule results + decision.
  await prisma.eligibilityRuleResult.createMany({
    data: decision.results.map((r) => ({
      applicationId: app.id,
      ruleCode: r.ruleCode,
      ruleVersion: decision.ruleVersion,
      outcome: r.outcome,
      reason: r.reason,
      inputsJson: JSON.stringify(evalInput),
    })),
  });
  await prisma.eligibilityDecision.create({
    data: {
      applicationId: app.id,
      outcome: decision.outcome,
      automatic: decision.automatic,
      reason: decision.reason,
      ruleVersion: decision.ruleVersion,
    },
  });

  const target: ApplicationState =
    decision.outcome === "ELIGIBLE"
      ? "ELIGIBLE"
      : decision.outcome === "INELIGIBLE"
        ? "INELIGIBLE"
        : decision.outcome === "NEEDS_INFORMATION"
          ? "NEEDS_INFORMATION"
          : "MANUAL_REVIEW";

  await transitionApplication(app.id, target, "system", decision.reason);
  await recordAudit({
    type: "eligibility.decided",
    actorLabel: decision.automatic ? "system" : "system",
    targetType: "application",
    targetId: app.id,
    reason: decision.reason,
    metadata: { outcome: decision.outcome, automatic: decision.automatic },
  });

  // Create the service order for eligible customers.
  let serviceOrderId: string | null = null;
  if (decision.outcome === "ELIGIBLE") {
    const order = await createServiceOrderForApplication(app.id);
    serviceOrderId = order.id;
  }

  return { applicationId: app.id, reference: app.reference, decision, serviceOrderId };
}

/** Staff resolves a MANUAL_REVIEW application. */
export async function resolveManualReview(
  applicationId: string,
  outcome: "ELIGIBLE" | "INELIGIBLE" | "NEEDS_INFORMATION",
  actorLabel: string,
  reason: string,
) {
  await transitionApplication(applicationId, outcome, actorLabel, reason);
  await prisma.eligibilityDecision.create({
    data: {
      applicationId,
      outcome,
      automatic: false,
      reason,
      ruleVersion: (await getBusinessConfig()).eligibility.ruleVersion,
    },
  });
  await recordAudit({
    type: "application.manual_decision",
    actorLabel,
    targetType: "application",
    targetId: applicationId,
    reason,
    metadata: { outcome },
  });
  if (outcome === "ELIGIBLE") {
    return createServiceOrderForApplication(applicationId);
  }
  return null;
}
