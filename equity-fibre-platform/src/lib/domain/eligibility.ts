/**
 * Deterministic eligibility rules engine.
 *
 * IMPORTANT: This is the ONLY place an eligibility outcome is decided. An LLM
 * MUST NOT make this decision (it may only explain a decision already made).
 * Rules are configuration-driven (BusinessConfig) — do not hard-code a single
 * interpretation of the launch scope (see Q1-Q8).
 */
import type {
  BusinessConfig,
  EvidenceType,
  HousingCategory,
} from "@/lib/config/business";

export type EligibilityOutcome =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "NEEDS_INFORMATION"
  | "MANUAL_REVIEW";

export interface EligibilityInput {
  ontInstalled: boolean;
  /** Days since last known fibre activity; null = never active. */
  daysSinceLastActive: number | null;
  /** Provider signalled a conflicting/unavailable state (e.g. Chorus 5xx). */
  providerConflict?: boolean;
  providerUnavailable?: boolean;
  housingCategory: HousingCategory;
  evidenceType: EvidenceType;
  evidenceProvided: boolean;
  /** Another active application/service already exists at this address. */
  duplicateActiveAtAddress?: boolean;
}

export interface RuleResult {
  ruleCode: string;
  outcome: "pass" | "fail" | "needs_info" | "manual_review";
  reason: string;
}

export interface EligibilityDecision {
  outcome: EligibilityOutcome;
  reason: string;
  ruleVersion: string;
  automatic: boolean;
  results: RuleResult[];
  inputs: EligibilityInput;
}

/**
 * Evaluate deterministic rules. Order matters: hard fails first, then
 * information gaps, then manual-review conditions, else eligible.
 */
export function evaluateEligibility(
  input: EligibilityInput,
  cfg: BusinessConfig,
): EligibilityDecision {
  const results: RuleResult[] = [];
  const ruleVersion = cfg.eligibility.ruleVersion;

  // Rule: provider availability (transient) -> manual review, don't guess.
  if (input.providerUnavailable) {
    results.push({
      ruleCode: "PROVIDER_UNAVAILABLE",
      outcome: "manual_review",
      reason:
        "The availability provider could not be reached. Routed for manual review rather than a guess.",
    });
    return decide(results, ruleVersion, input);
  }

  // Rule: conflicting provider data -> manual review.
  if (input.providerConflict) {
    results.push({
      ruleCode: "PROVIDER_CONFLICT",
      outcome: "manual_review",
      reason:
        "Address and provider records conflict. Operations must resolve before a decision.",
    });
  }

  // Rule: duplicate active service at address -> ineligible (hard).
  if (input.duplicateActiveAtAddress) {
    results.push({
      ruleCode: "DUPLICATE_ACTIVE_SERVICE",
      outcome: "fail",
      reason: "An active Equity Fibre service or application already exists at this address.",
    });
  }

  // Rule: ONT must be installed.
  if (!input.ontInstalled) {
    results.push({
      ruleCode: "ONT_REQUIRED",
      outcome: "fail",
      reason: "No Chorus fibre ONT is installed at this address.",
    });
  } else {
    results.push({ ruleCode: "ONT_REQUIRED", outcome: "pass", reason: "ONT present." });
  }

  // Rule: inactivity period (only meaningful if ONT present).
  if (input.ontInstalled) {
    if (input.daysSinceLastActive === null) {
      results.push({
        ruleCode: "INACTIVITY_PERIOD",
        outcome: "pass",
        reason: "No prior active fibre service recorded at this address.",
      });
    } else if (input.daysSinceLastActive < cfg.eligibility.inactivityDays) {
      results.push({
        ruleCode: "INACTIVITY_PERIOD",
        outcome: "fail",
        reason: `Fibre was active within the last ${cfg.eligibility.inactivityDays} days.`,
      });
    } else {
      results.push({
        ruleCode: "INACTIVITY_PERIOD",
        outcome: "pass",
        reason: `Fibre inactive for at least ${cfg.eligibility.inactivityDays} days.`,
      });
    }
  }

  // Rule: household category must be enabled.
  const housingEnabled = cfg.eligibility.enabledHousingCategories.includes(
    input.housingCategory,
  );
  if (input.housingCategory === "none") {
    results.push({
      ruleCode: "HOUSEHOLD_CATEGORY",
      outcome: "needs_info",
      reason: "No qualifying household category was selected.",
    });
  } else if (!housingEnabled) {
    results.push({
      ruleCode: "HOUSEHOLD_CATEGORY",
      outcome: "fail",
      reason: `The '${input.housingCategory}' category is not part of the current launch scope.`,
    });
  } else {
    results.push({
      ruleCode: "HOUSEHOLD_CATEGORY",
      outcome: "pass",
      reason: "A qualifying household category was selected.",
    });
  }

  // Rule: evidence type must be enabled AND provided.
  const evidenceEnabled = cfg.eligibility.enabledEvidenceTypes.includes(
    input.evidenceType,
  );
  if (input.evidenceType === "none" || !input.evidenceProvided) {
    results.push({
      ruleCode: "EVIDENCE_REQUIRED",
      outcome: "needs_info",
      reason: "Approved low-income evidence has not yet been provided.",
    });
  } else if (!evidenceEnabled) {
    results.push({
      ruleCode: "EVIDENCE_REQUIRED",
      outcome: "fail",
      reason: `The provided evidence type is not accepted in the current launch scope.`,
    });
  } else {
    // NOTE: completeness only. Authenticity verification is a separate,
    // authorised process — we NEVER claim OCR/AI authenticated a document.
    results.push({
      ruleCode: "EVIDENCE_REQUIRED",
      outcome: "pass",
      reason: "Approved evidence type supplied (authenticity to be verified separately).",
    });
  }

  return decide(results, ruleVersion, input);
}

function decide(
  results: RuleResult[],
  ruleVersion: string,
  inputs: EligibilityInput,
): EligibilityDecision {
  const has = (o: RuleResult["outcome"]) => results.some((r) => r.outcome === o);

  let outcome: EligibilityOutcome;
  let reason: string;
  if (has("fail")) {
    outcome = "INELIGIBLE";
    reason = results.find((r) => r.outcome === "fail")!.reason;
  } else if (has("manual_review")) {
    outcome = "MANUAL_REVIEW";
    reason = results.find((r) => r.outcome === "manual_review")!.reason;
  } else if (has("needs_info")) {
    outcome = "NEEDS_INFORMATION";
    reason = results.find((r) => r.outcome === "needs_info")!.reason;
  } else {
    outcome = "ELIGIBLE";
    reason = "All configured eligibility rules passed.";
  }

  return {
    outcome,
    reason,
    ruleVersion,
    automatic: outcome !== "MANUAL_REVIEW",
    results,
    inputs,
  };
}
