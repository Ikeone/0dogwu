import { describe, it, expect } from "vitest";
import { monthlyPrice, modemContribution, unitEconomics } from "@/lib/domain/pricing";
import { DEFAULT_BUSINESS_CONFIG } from "@/lib/config/business";

const cfg = DEFAULT_BUSINESS_CONFIG;

describe("pricing", () => {
  it("splits GST out of a GST-inclusive price", () => {
    const p = monthlyPrice(cfg); // $30 incl 15% GST
    expect(p.consumerPriceCents).toBe(3000);
    expect(p.exGstCents).toBe(2609); // 3000 / 1.15 = 2608.7 -> 2609
    expect(p.gstComponentCents).toBe(391);
  });

  it("computes the $55 customer modem contribution by default", () => {
    const m = modemContribution(cfg); // 70 + 15 - 30
    expect(m.customerContributionCents).toBe(5500);
  });

  it("charges full modem+shipping when deduction is disabled", () => {
    const m = modemContribution({ ...cfg, modem: { ...cfg.modem, deductChorusContribution: false } });
    expect(m.customerContributionCents).toBe(8500);
  });

  it("never goes negative", () => {
    const m = modemContribution({ ...cfg, modem: { ...cfg.modem, chorusContributionCents: 100000 } });
    expect(m.customerContributionCents).toBe(0);
  });

  it("estimates a positive per-customer contribution", () => {
    const e = unitEconomics(cfg);
    expect(e.retailCents).toBe(3000);
    expect(e.estimatedContributionCents).toBeGreaterThan(0);
    expect(e.estimatedContributionCents).toBeLessThan(3000);
  });
});
