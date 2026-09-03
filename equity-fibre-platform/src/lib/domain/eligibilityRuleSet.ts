/**
 * Versioned, configurable eligibility rule set (productionised).
 *
 * Replaces four unconditional booleans with an explicit, versioned rule set of
 * ALL/ANY groups. Encodes the provisional public Chorus expression:
 *
 *   fibre_is_already_installed
 *   AND fibre_has_not_been_connected_in_the_previous_three_months
 *   AND ( social/community housing OR school equity index >= 490 )
 *   AND ( valid Community Services Card OR accepted MyMSD benefit letter )
 *
 * Key production properties:
 *  - The authoritative provider result (when present) takes precedence over the
 *    local inactivity interpretation; local rule is configurable until confirmed.
 *  - Unavailable/conflicting/inconclusive => MANUAL_REVIEW_REQUIRED (never auto).
 *  - OCR/LLM never authenticate a government document. A MANUAL_DOCUMENT_REVIEW
 *    verification path routes a complete application to human review, not auto-approve.
 *  - Every decision records the rule-set version + exact inputs used.
 *
 * NOTE: The final logic/authority is BLOCKED_EXTERNAL (CHORUS-001) — this is the
 * provisional interpretation pending the WN/Chorus contract.
 */

export type RuleSetStatus = "DRAFT" | "APPROVED" | "RETIRED";

export type VerificationPath =
  | "AUTHORITATIVE_API" // provider returns a definitive eligibility result
  | "PREQUALIFIED_TOKEN" // Chorus/partner prequalification token
  | "PARTNER_ATTESTATION" // approved partner attests
  | "MANUAL_DOCUMENT_REVIEW"; // secure upload + authorised human review

export type EligibilityOutcome =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "NEEDS_INFORMATION"
  | "MANUAL_REVIEW_REQUIRED";

export type HousingCategory =
  | "public_housing"
  | "community_housing"
  | "school_equity"
  | "none";

export type EvidenceType =
  | "community_services_card"
  | "msd_benefit_letter"
  | "none";

/** Serializable rule-set definition (would live in DB/config in production). */
export interface EligibilityRuleSet {
  version: string;
  effectiveDate: string; // ISO date
  source: string; // authority (e.g. "Chorus Equity Fibre public criteria (provisional)")
  status: RuleSetStatus;
  approvedBy?: string;
  approvedAt?: string;
  /** Inactivity window; may be days or "three calendar months" semantics. */
  inactivity: { mode: "DAYS" | "THREE_CALENDAR_MONTHS"; days: number };
  enabledHousingCategories: HousingCategory[];
  schoolEquityIndexThreshold: number;
  enabledEvidenceTypes: EvidenceType[];
  /** Reason text shown to customers per internal code. */
  customerReasons: Record<string, string>;
}

/** The provisional, APPROVED-for-pilot-shape default rule set. */
export const DEFAULT_RULESET: EligibilityRuleSet = {
  version: "2026.05-provisional",
  effectiveDate: "2026-05-01",
  source: "Chorus Equity Fibre public criteria (provisional; BLOCKED_EXTERNAL CHORUS-001)",
  status: "APPROVED",
  approvedBy: "provisional/self (pending WN legal + Chorus contract)",
  approvedAt: "2026-05-01",
  inactivity: { mode: "DAYS", days: 90 },
  enabledHousingCategories: ["public_housing", "community_housing"],
  schoolEquityIndexThreshold: 490,
  enabledEvidenceTypes: ["community_services_card", "msd_benefit_letter"],
  customerReasons: {
    ONT_REQUIRED: "This address does not yet have a fibre connection installed.",
    INACTIVITY_PERIOD: "This address has had an active fibre service too recently to qualify.",
    HOUSEHOLD_CATEGORY: "We couldn't confirm a qualifying household category.",
    EVIDENCE_REQUIRED: "We still need approved evidence to confirm eligibility.",
    PROVIDER_UNAVAILABLE: "We couldn't confirm details with the network right now; a person will review this.",
    PROVIDER_CONFLICT: "The information we have needs a person to review before we can decide.",
    DUPLICATE_ACTIVE_SERVICE: "There is already an active service or application at this address.",
    MANUAL_REVIEW: "Your evidence will be checked by our team.",
  },
};

/** Build a rule set from runtime business configuration (config-driven). */
export function ruleSetFromConfig(cfg: {
  inactivityDays: number;
  enabledHousingCategories: string[];
  enabledEvidenceTypes: string[];
  ruleVersion: string;
}): EligibilityRuleSet {
  return {
    ...DEFAULT_RULESET,
    version: cfg.ruleVersion || DEFAULT_RULESET.version,
    inactivity: { mode: "DAYS", days: cfg.inactivityDays },
    enabledHousingCategories: cfg.enabledHousingCategories as HousingCategory[],
    enabledEvidenceTypes: cfg.enabledEvidenceTypes as EvidenceType[],
  };
}

/** Definitive authoritative signal (from a provider), when available. */
export type AuthoritativeResult = "eligible" | "ineligible" | "inconclusive";

export interface RuleSetInput {
  verificationPath: VerificationPath;
  /** For AUTHORITATIVE_API / PREQUALIFIED_TOKEN paths. */
  authoritativeResult?: AuthoritativeResult;
  prequalTokenValid?: boolean;
  partnerAttested?: boolean;

  ontInstalled: boolean;
  daysSinceLastActive: number | null; // null = never active
  providerUnavailable?: boolean;
  providerConflict?: boolean;
  duplicateActiveAtAddress?: boolean;

  housingCategory: HousingCategory;
  schoolEquityIndex?: number | null;

  evidenceType: EvidenceType;
  evidenceProvided: boolean;
  evidenceExpired?: boolean;
  evidenceReviewed?: boolean; // for MANUAL_DOCUMENT_REVIEW
  evidenceReviewOutcome?: "accepted" | "rejected";
}

export interface RuleResult {
  code: string;
  outcome: "pass" | "fail" | "needs_info" | "manual_review";
  reason: string;
}

export interface RuleSetDecision {
  outcome: EligibilityOutcome;
  reason: string;
  ruleSetVersion: string;
  verificationPath: VerificationPath;
  automatic: boolean;
  results: RuleResult[];
  inputs: RuleSetInput;
}

function decide(results: RuleResult[], rs: EligibilityRuleSet, input: RuleSetInput, note?: string): RuleSetDecision {
  const has = (o: RuleResult["outcome"]) => results.some((r) => r.outcome === o);
  let outcome: EligibilityOutcome;
  let reason: string;
  if (has("fail")) {
    outcome = "INELIGIBLE";
    reason = results.find((r) => r.outcome === "fail")!.reason;
  } else if (has("manual_review")) {
    outcome = "MANUAL_REVIEW_REQUIRED";
    reason = results.find((r) => r.outcome === "manual_review")!.reason;
  } else if (has("needs_info")) {
    outcome = "NEEDS_INFORMATION";
    reason = results.find((r) => r.outcome === "needs_info")!.reason;
  } else {
    outcome = "ELIGIBLE";
    reason = note ?? "All configured eligibility rules passed.";
  }
  return {
    outcome,
    reason,
    ruleSetVersion: rs.version,
    verificationPath: input.verificationPath,
    automatic: outcome !== "MANUAL_REVIEW_REQUIRED",
    results,
    inputs: input,
  };
}

/**
 * Evaluate an application against a versioned rule set. Deterministic.
 */
export function evaluateRuleSet(input: RuleSetInput, rs: EligibilityRuleSet = DEFAULT_RULESET): RuleSetDecision {
  if (rs.status !== "APPROVED") {
    // A non-approved rule set must never auto-decide.
    return decide(
      [{ code: "RULESET_NOT_APPROVED", outcome: "manual_review", reason: "The eligibility rule set is not approved for automatic decisions." }],
      rs,
      input,
    );
  }

  // Provider outages/conflicts route to manual review before anything else.
  if (input.providerUnavailable) {
    return decide([{ code: "PROVIDER_UNAVAILABLE", outcome: "manual_review", reason: rs.customerReasons.PROVIDER_UNAVAILABLE! }], rs, input);
  }

  const results: RuleResult[] = [];
  if (input.providerConflict) {
    results.push({ code: "PROVIDER_CONFLICT", outcome: "manual_review", reason: rs.customerReasons.PROVIDER_CONFLICT! });
  }
  if (input.duplicateActiveAtAddress) {
    results.push({ code: "DUPLICATE_ACTIVE_SERVICE", outcome: "fail", reason: rs.customerReasons.DUPLICATE_ACTIVE_SERVICE! });
  }

  // Authoritative signal takes precedence over local inactivity interpretation.
  if ((input.verificationPath === "AUTHORITATIVE_API" || input.verificationPath === "PREQUALIFIED_TOKEN") && input.authoritativeResult) {
    if (input.authoritativeResult === "inconclusive") {
      results.push({ code: "AUTHORITATIVE_INCONCLUSIVE", outcome: "manual_review", reason: rs.customerReasons.PROVIDER_CONFLICT! });
    } else if (input.authoritativeResult === "ineligible") {
      results.push({ code: "AUTHORITATIVE_INELIGIBLE", outcome: "fail", reason: rs.customerReasons.INACTIVITY_PERIOD! });
    } else {
      results.push({ code: "AUTHORITATIVE_ELIGIBLE", outcome: "pass", reason: "Provider confirmed the site meets the installation/inactivity criteria." });
    }
  } else {
    // Local interpretation: ONT + inactivity.
    if (!input.ontInstalled) {
      results.push({ code: "ONT_REQUIRED", outcome: "fail", reason: rs.customerReasons.ONT_REQUIRED! });
    } else {
      results.push({ code: "ONT_REQUIRED", outcome: "pass", reason: "Fibre is installed." });
      if (input.daysSinceLastActive === null) {
        results.push({ code: "INACTIVITY_PERIOD", outcome: "pass", reason: "No recent active service recorded." });
      } else if (input.daysSinceLastActive < rs.inactivity.days) {
        results.push({ code: "INACTIVITY_PERIOD", outcome: "fail", reason: rs.customerReasons.INACTIVITY_PERIOD! });
      } else {
        results.push({ code: "INACTIVITY_PERIOD", outcome: "pass", reason: "Fibre inactive long enough to qualify." });
      }
    }
  }

  // Household group: ANY( social/community housing, school equity >= threshold ).
  const housingQualifies =
    rs.enabledHousingCategories.includes(input.housingCategory) &&
    (input.housingCategory === "public_housing" || input.housingCategory === "community_housing");
  const schoolQualifies =
    rs.enabledHousingCategories.includes("school_equity") &&
    input.housingCategory === "school_equity" &&
    typeof input.schoolEquityIndex === "number" &&
    input.schoolEquityIndex >= rs.schoolEquityIndexThreshold;
  if (input.housingCategory === "none") {
    results.push({ code: "HOUSEHOLD_CATEGORY", outcome: "needs_info", reason: rs.customerReasons.HOUSEHOLD_CATEGORY! });
  } else if (housingQualifies || schoolQualifies) {
    results.push({ code: "HOUSEHOLD_CATEGORY", outcome: "pass", reason: "A qualifying household category was confirmed." });
  } else {
    results.push({ code: "HOUSEHOLD_CATEGORY", outcome: "fail", reason: rs.customerReasons.HOUSEHOLD_CATEGORY! });
  }

  // Evidence group: ANY( CSC, MyMSD ) + verification-path handling.
  const evidenceAccepted = rs.enabledEvidenceTypes.includes(input.evidenceType);
  if (input.verificationPath === "PARTNER_ATTESTATION" && input.partnerAttested) {
    results.push({ code: "EVIDENCE_REQUIRED", outcome: "pass", reason: "An approved partner attested to eligibility." });
  } else if (input.evidenceType === "none" || !input.evidenceProvided) {
    results.push({ code: "EVIDENCE_REQUIRED", outcome: "needs_info", reason: rs.customerReasons.EVIDENCE_REQUIRED! });
  } else if (input.evidenceExpired) {
    results.push({ code: "EVIDENCE_REQUIRED", outcome: "needs_info", reason: "The evidence provided has expired; please provide current evidence." });
  } else if (!evidenceAccepted) {
    results.push({ code: "EVIDENCE_REQUIRED", outcome: "fail", reason: "The evidence type provided is not accepted in the current launch scope." });
  } else if (input.verificationPath === "MANUAL_DOCUMENT_REVIEW") {
    // Completeness only; a human must authorise. Never auto-approve a document.
    if (input.evidenceReviewed) {
      results.push(
        input.evidenceReviewOutcome === "accepted"
          ? { code: "EVIDENCE_REQUIRED", outcome: "pass", reason: "Evidence reviewed and accepted by an authorised reviewer." }
          : { code: "EVIDENCE_REQUIRED", outcome: "fail", reason: "Evidence was reviewed and not accepted." },
      );
    } else {
      results.push({ code: "EVIDENCE_MANUAL_REVIEW", outcome: "manual_review", reason: rs.customerReasons.MANUAL_REVIEW! });
    }
  } else {
    // AUTHORITATIVE / PREQUALIFIED path with complete accepted evidence type.
    results.push({ code: "EVIDENCE_REQUIRED", outcome: "pass", reason: "Approved evidence type supplied." });
  }

  return decide(results, rs, input);
}
