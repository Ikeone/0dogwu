/**
 * Central business configuration.
 *
 * ALL commercial values live here (or in the database SystemConfiguration table
 * for values an administrator may change at runtime). Do NOT scatter prices,
 * eligibility rules, or trigger choices through the codebase.
 *
 * Every value that is a working assumption is cross-referenced to an open
 * question in docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md (e.g. Q19, Q25).
 */

export type ModemPaymentTrigger =
  | "BEFORE_SHIPMENT"
  | "ON_SHIPMENT"
  | "ON_DELIVERY";

export type MonthlyBillingTrigger =
  | "SERVICE_ACTIVATION"
  | "MODEM_DELIVERY"
  | "MANUAL_APPROVAL";

export type HousingCategory =
  | "public_housing"
  | "community_housing"
  | "school_equity"
  | "none";

export type EvidenceType =
  | "community_services_card"
  | "msd_benefit_letter"
  | "none";

export interface BusinessConfig {
  plan: {
    name: string;
    code: string;
    downloadMbps: number;
    uploadMbps: number;
    /** Consumer price in cents. Working assumption: GST-inclusive (Q19). */
    consumerPriceCents: number;
    priceIsGstInclusive: boolean;
    gstRate: number;
    /** Chorus wholesale, cents, ex-GST. Working assumption ~ $8 + GST (Q21). */
    wholesaleCentsExGst: number;
  };
  modem: {
    purchaseCents: number; // ~ $70 (Q33 model unknown)
    shippingCents: number; // ~ $15
    chorusContributionCents: number; // ~ $30 (Q24 treatment unconfirmed)
    /**
     * How the customer contribution is computed. Working assumption:
     * purchase + shipping - chorusContribution = $55 (Q25).
     * `deductChorusContribution` toggles whether the $30 reduces the customer
     * price; commercial treatment is not yet confirmed.
     */
    deductChorusContribution: boolean;
    allowBringYourOwnModem: boolean; // out of scope for launch (Q32)
  };
  eligibility: {
    /** Minimum inactivity before an address qualifies. Q7/Q8 unresolved. */
    inactivityDays: number;
    enabledHousingCategories: HousingCategory[];
    enabledEvidenceTypes: EvidenceType[];
    ruleVersion: string;
  };
  billing: {
    modemPaymentTrigger: ModemPaymentTrigger;
    monthlyBillingTrigger: MonthlyBillingTrigger;
    gracePeriodDays: number; // Q30
    autoRetryLimit: number;
    suspendOnSingleFailure: boolean; // must remain false unless WN approves
  };
  evidence: {
    retentionDays: number; // Q44 approved period unknown
    maxUploadBytes: number;
    allowedMimeTypes: string[];
  };
  support: {
    escalateAfterUnresolvedAnswers: number;
    ticketsPerHundredTarget: number;
  };
}

/**
 * Default demo configuration. These are the "working assumptions" surfaced in
 * the UI. Admins can override several of these via SystemConfiguration.
 */
export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  plan: {
    name: "Equity Fibre 100",
    code: "EQUITY_FIBRE_100",
    downloadMbps: 100,
    uploadMbps: 20,
    consumerPriceCents: 3000, // $30.00
    priceIsGstInclusive: true,
    gstRate: 0.15,
    wholesaleCentsExGst: 800, // $8.00 ex-GST
  },
  modem: {
    purchaseCents: 7000, // $70.00
    shippingCents: 1500, // $15.00
    chorusContributionCents: 3000, // $30.00
    deductChorusContribution: true,
    allowBringYourOwnModem: false,
  },
  eligibility: {
    inactivityDays: 90,
    // Demo launches with the narrower scope WN suggested: government/community
    // housing + Community Services Card. School path is defined but disabled.
    enabledHousingCategories: ["public_housing", "community_housing"],
    enabledEvidenceTypes: ["community_services_card", "msd_benefit_letter"],
    ruleVersion: "2025.09-demo",
  },
  billing: {
    modemPaymentTrigger: "BEFORE_SHIPMENT",
    monthlyBillingTrigger: "SERVICE_ACTIVATION",
    gracePeriodDays: 14,
    autoRetryLimit: 5,
    suspendOnSingleFailure: false,
  },
  evidence: {
    retentionDays: 365,
    maxUploadBytes: 8 * 1024 * 1024, // 8 MB
    allowedMimeTypes: ["image/png", "image/jpeg", "application/pdf"],
  },
  support: {
    escalateAfterUnresolvedAnswers: 2,
    ticketsPerHundredTarget: 20,
  },
};

/** Keys that an administrator may override at runtime (SystemConfiguration). */
export const RUNTIME_CONFIG_KEYS = [
  "eligibility.enabledHousingCategories",
  "eligibility.enabledEvidenceTypes",
  "eligibility.inactivityDays",
  "billing.modemPaymentTrigger",
  "billing.monthlyBillingTrigger",
  "billing.gracePeriodDays",
  "billing.suspendOnSingleFailure",
  "modem.deductChorusContribution",
] as const;
