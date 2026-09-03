import { NextResponse } from "next/server";
import { getBusinessConfig } from "@/lib/services/config";
import { modemContribution, monthlyPrice } from "@/lib/domain/pricing";

/** Non-sensitive business config for the customer UI. No secrets, no costs. */
export async function GET() {
  const cfg = await getBusinessConfig();
  return NextResponse.json({
    plan: {
      name: cfg.plan.name,
      downloadMbps: cfg.plan.downloadMbps,
      uploadMbps: cfg.plan.uploadMbps,
      monthlyPriceCents: monthlyPrice(cfg).consumerPriceCents,
    },
    modemContributionCents: modemContribution(cfg).customerContributionCents,
    inactivityDays: cfg.eligibility.inactivityDays,
    enabledHousingCategories: cfg.eligibility.enabledHousingCategories,
    enabledEvidenceTypes: cfg.eligibility.enabledEvidenceTypes,
    allowedMimeTypes: cfg.evidence.allowedMimeTypes,
  });
}
