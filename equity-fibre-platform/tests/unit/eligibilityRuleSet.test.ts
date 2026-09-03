import { describe, it, expect } from "vitest";
import {
  evaluateRuleSet,
  ruleSetFromConfig,
  DEFAULT_RULESET,
  type RuleSetInput,
  type EligibilityRuleSet,
} from "@/lib/domain/eligibilityRuleSet";

function input(over: Partial<RuleSetInput> = {}): RuleSetInput {
  return {
    verificationPath: "AUTHORITATIVE_API",
    authoritativeResult: "eligible",
    ontInstalled: true,
    daysSinceLastActive: 200,
    housingCategory: "public_housing",
    schoolEquityIndex: null,
    evidenceType: "community_services_card",
    evidenceProvided: true,
    ...over,
  };
}

describe("versioned eligibility rule set", () => {
  it("approves the canonical eligible combination", () => {
    expect(evaluateRuleSet(input()).outcome).toBe("ELIGIBLE");
  });

  it("AND: fails when ONT missing even if everything else passes (no authoritative)", () => {
    const d = evaluateRuleSet(input({ verificationPath: "MANUAL_DOCUMENT_REVIEW", authoritativeResult: undefined, ontInstalled: false, evidenceReviewed: true, evidenceReviewOutcome: "accepted" }));
    expect(d.outcome).toBe("INELIGIBLE");
    expect(d.results.some((r) => r.code === "ONT_REQUIRED" && r.outcome === "fail")).toBe(true);
  });

  it("OR housing: school-equity path qualifies only when enabled and index >= threshold", () => {
    const schoolRs: EligibilityRuleSet = { ...DEFAULT_RULESET, enabledHousingCategories: ["school_equity"] };
    expect(evaluateRuleSet(input({ housingCategory: "school_equity", schoolEquityIndex: 500 }), schoolRs).outcome).toBe("ELIGIBLE");
    expect(evaluateRuleSet(input({ housingCategory: "school_equity", schoolEquityIndex: 489 }), schoolRs).outcome).toBe("INELIGIBLE");
  });

  it("OR evidence: MyMSD letter is accepted", () => {
    expect(evaluateRuleSet(input({ evidenceType: "msd_benefit_letter" })).outcome).toBe("ELIGIBLE");
  });

  it("authoritative result takes precedence over local inactivity", () => {
    // Local data would say recently-active (fail), but provider says eligible.
    expect(evaluateRuleSet(input({ daysSinceLastActive: 5, authoritativeResult: "eligible" })).outcome).toBe("ELIGIBLE");
    // And provider ineligible overrides a locally-passing inactivity.
    expect(evaluateRuleSet(input({ daysSinceLastActive: 400, authoritativeResult: "ineligible" })).outcome).toBe("INELIGIBLE");
  });

  it("provider outage/timeout routes to manual review, never auto-decides", () => {
    expect(evaluateRuleSet(input({ providerUnavailable: true })).outcome).toBe("MANUAL_REVIEW_REQUIRED");
  });

  it("inconclusive authoritative result routes to manual review", () => {
    expect(evaluateRuleSet(input({ authoritativeResult: "inconclusive" })).outcome).toBe("MANUAL_REVIEW_REQUIRED");
  });

  it("provider conflict routes to manual review", () => {
    expect(evaluateRuleSet(input({ providerConflict: true })).outcome).toBe("MANUAL_REVIEW_REQUIRED");
  });

  it("duplicate active service at address is ineligible", () => {
    expect(evaluateRuleSet(input({ duplicateActiveAtAddress: true })).outcome).toBe("INELIGIBLE");
  });

  it("missing evidence needs information", () => {
    expect(evaluateRuleSet(input({ evidenceProvided: false, evidenceType: "none" })).outcome).toBe("NEEDS_INFORMATION");
  });

  it("expired evidence needs information", () => {
    expect(evaluateRuleSet(input({ evidenceExpired: true })).outcome).toBe("NEEDS_INFORMATION");
  });

  it("prequalified token path with eligible result approves", () => {
    expect(evaluateRuleSet(input({ verificationPath: "PREQUALIFIED_TOKEN", prequalTokenValid: true, authoritativeResult: "eligible" })).outcome).toBe("ELIGIBLE");
  });

  it("partner attestation satisfies the evidence group", () => {
    expect(evaluateRuleSet(input({ verificationPath: "PARTNER_ATTESTATION", partnerAttested: true, evidenceType: "none", evidenceProvided: false })).outcome).toBe("ELIGIBLE");
  });

  it("MANUAL_DOCUMENT_REVIEW never auto-approves a document; requires human outcome", () => {
    const pending = evaluateRuleSet(input({ verificationPath: "MANUAL_DOCUMENT_REVIEW", authoritativeResult: undefined }));
    expect(pending.outcome).toBe("MANUAL_REVIEW_REQUIRED");
    const accepted = evaluateRuleSet(input({ verificationPath: "MANUAL_DOCUMENT_REVIEW", authoritativeResult: undefined, evidenceReviewed: true, evidenceReviewOutcome: "accepted" }));
    expect(accepted.outcome).toBe("ELIGIBLE");
    const rejected = evaluateRuleSet(input({ verificationPath: "MANUAL_DOCUMENT_REVIEW", authoritativeResult: undefined, evidenceReviewed: true, evidenceReviewOutcome: "rejected" }));
    expect(rejected.outcome).toBe("INELIGIBLE");
  });

  it("a non-APPROVED rule set never auto-decides (version/status transition)", () => {
    const draft: EligibilityRuleSet = { ...DEFAULT_RULESET, status: "DRAFT" };
    expect(evaluateRuleSet(input(), draft).outcome).toBe("MANUAL_REVIEW_REQUIRED");
    const retired: EligibilityRuleSet = { ...DEFAULT_RULESET, status: "RETIRED" };
    expect(evaluateRuleSet(input(), retired).outcome).toBe("MANUAL_REVIEW_REQUIRED");
  });

  it("records the rule-set version and inputs used", () => {
    const d = evaluateRuleSet(input());
    expect(d.ruleSetVersion).toBe(DEFAULT_RULESET.version);
    expect(d.inputs.housingCategory).toBe("public_housing");
  });

  it("is config-driven (inactivity + enabled categories)", () => {
    const rs = ruleSetFromConfig({ inactivityDays: 30, enabledHousingCategories: ["public_housing"], enabledEvidenceTypes: ["community_services_card"], ruleVersion: "test.1" });
    expect(rs.inactivity.days).toBe(30);
    // community_housing not enabled here -> local (no authoritative) fails housing
    const d = evaluateRuleSet(input({ verificationPath: "MANUAL_DOCUMENT_REVIEW", authoritativeResult: undefined, housingCategory: "community_housing", evidenceReviewed: true, evidenceReviewOutcome: "accepted" }), rs);
    expect(d.outcome).toBe("INELIGIBLE");
  });
});
