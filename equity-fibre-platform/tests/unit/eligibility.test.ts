import { describe, it, expect } from "vitest";
import { evaluateEligibility, type EligibilityInput } from "@/lib/domain/eligibility";
import { DEFAULT_BUSINESS_CONFIG } from "@/lib/config/business";

const cfg = DEFAULT_BUSINESS_CONFIG;

function base(overrides: Partial<EligibilityInput> = {}): EligibilityInput {
  return {
    ontInstalled: true,
    daysSinceLastActive: 200,
    housingCategory: "public_housing",
    evidenceType: "community_services_card",
    evidenceProvided: true,
    ...overrides,
  };
}

describe("eligibility rules engine", () => {
  it("approves an eligible social-housing customer", () => {
    expect(evaluateEligibility(base(), cfg).outcome).toBe("ELIGIBLE");
  });

  it("rejects recently active fibre", () => {
    expect(evaluateEligibility(base({ daysSinceLastActive: 20 }), cfg).outcome).toBe("INELIGIBLE");
  });

  it("rejects when no ONT installed", () => {
    const d = evaluateEligibility(base({ ontInstalled: false }), cfg);
    expect(d.outcome).toBe("INELIGIBLE");
    expect(d.results.some((r) => r.ruleCode === "ONT_REQUIRED" && r.outcome === "fail")).toBe(true);
  });

  it("needs information when evidence missing", () => {
    expect(evaluateEligibility(base({ evidenceProvided: false, evidenceType: "none" }), cfg).outcome).toBe("NEEDS_INFORMATION");
  });

  it("rejects unsupported evidence within scope", () => {
    // school_equity housing is disabled by default -> fail
    const d = evaluateEligibility(base({ housingCategory: "school_equity" }), cfg);
    expect(d.outcome).toBe("INELIGIBLE");
  });

  it("routes conflicting provider data to manual review", () => {
    expect(evaluateEligibility(base({ providerConflict: true }), cfg).outcome).toBe("MANUAL_REVIEW");
  });

  it("routes provider-unavailable to manual review", () => {
    expect(evaluateEligibility(base({ providerUnavailable: true }), cfg).outcome).toBe("MANUAL_REVIEW");
  });

  it("rejects a duplicate active service at the address", () => {
    expect(evaluateEligibility(base({ duplicateActiveAtAddress: true }), cfg).outcome).toBe("INELIGIBLE");
  });

  it("treats a never-active ONT address as passing the inactivity rule", () => {
    expect(evaluateEligibility(base({ daysSinceLastActive: null }), cfg).outcome).toBe("ELIGIBLE");
  });

  it("marks automatic vs manual correctly", () => {
    expect(evaluateEligibility(base(), cfg).automatic).toBe(true);
    expect(evaluateEligibility(base({ providerConflict: true }), cfg).automatic).toBe(false);
  });

  it("qualifies a school customer when the school path is enabled", () => {
    const schoolCfg = {
      ...cfg,
      eligibility: {
        ...cfg.eligibility,
        enabledHousingCategories: ["school_equity" as const],
      },
    };
    expect(evaluateEligibility(base({ housingCategory: "school_equity" }), schoolCfg).outcome).toBe("ELIGIBLE");
  });
});
