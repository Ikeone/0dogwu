/**
 * Pricing & modem contribution calculations. All configurable — see
 * BusinessConfig. Amounts are in integer cents to avoid float errors.
 */
import type { BusinessConfig } from "@/lib/config/business";

export interface PriceBreakdown {
  consumerPriceCents: number;
  gstComponentCents: number;
  exGstCents: number;
  gstInclusive: boolean;
}

export function monthlyPrice(cfg: BusinessConfig): PriceBreakdown {
  const { consumerPriceCents, priceIsGstInclusive, gstRate } = cfg.plan;
  if (priceIsGstInclusive) {
    const exGst = Math.round(consumerPriceCents / (1 + gstRate));
    return {
      consumerPriceCents,
      gstComponentCents: consumerPriceCents - exGst,
      exGstCents: exGst,
      gstInclusive: true,
    };
  }
  const gst = Math.round(consumerPriceCents * gstRate);
  return {
    consumerPriceCents,
    gstComponentCents: gst,
    exGstCents: consumerPriceCents,
    gstInclusive: false,
  };
}

export interface ModemContribution {
  purchaseCents: number;
  shippingCents: number;
  chorusContributionCents: number;
  customerContributionCents: number;
  shortfallCents: number; // >0 means WN subsidises; <0 means surplus
}

/**
 * Customer upfront modem contribution.
 * Working assumption (Q25): purchase + shipping - chorusContribution = $55,
 * toggled by cfg.modem.deductChorusContribution.
 */
export function modemContribution(cfg: BusinessConfig): ModemContribution {
  const { purchaseCents, shippingCents, chorusContributionCents } = cfg.modem;
  const base = purchaseCents + shippingCents;
  const customer = cfg.modem.deductChorusContribution
    ? base - chorusContributionCents
    : base;
  const clampedCustomer = Math.max(0, customer);
  const recovered = clampedCustomer + chorusContributionCents;
  return {
    purchaseCents,
    shippingCents,
    chorusContributionCents,
    customerContributionCents: clampedCustomer,
    shortfallCents: base - recovered,
  };
}

/** Estimated monthly gross contribution per active customer (internal only). */
export interface UnitEconomics {
  retailCents: number;
  wholesaleInclGstCents: number;
  paymentFeeCents: number;
  estimatedContributionCents: number;
}

export function unitEconomics(cfg: BusinessConfig): UnitEconomics {
  const price = monthlyPrice(cfg);
  const wholesaleInclGst = Math.round(
    cfg.plan.wholesaleCentsExGst * (1 + cfg.plan.gstRate),
  );
  // Simple payment fee estimate: 2.9% + 30c (configurable in future).
  const paymentFee = Math.round(price.consumerPriceCents * 0.029) + 30;
  const contribution =
    price.consumerPriceCents - wholesaleInclGst - paymentFee;
  return {
    retailCents: price.consumerPriceCents,
    wholesaleInclGstCents: wholesaleInclGst,
    paymentFeeCents: paymentFee,
    estimatedContributionCents: contribution,
  };
}

export function formatNzd(cents: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(cents / 100);
}
