/**
 * Hold types and the rule for whether a hold blocks automatic suspension.
 *
 * The platform serves low-income households: automatic suspension must never
 * proceed while a protective hold is active. All hold types below block auto
 * suspension by default (WN may refine policy — see docs/DECISIONS.md D5).
 */
export const HOLD_TYPES = [
  "financial_hardship",
  "payment_dispute",
  "complaint_investigation",
  "provider_outage",
  "wn_billing_error",
  "vulnerable_customer",
  "manual_operational",
  "legal_regulatory",
] as const;

export type HoldType = (typeof HOLD_TYPES)[number];

/** Every hold type currently blocks automatic suspension. */
export function holdBlocksSuspension(_type: HoldType): boolean {
  return true;
}

export interface HoldLike {
  active: boolean;
  expiresAt: Date | null;
  holdType: string;
}

/** A hold is effective if active and not past its expiry. */
export function isHoldEffective(hold: HoldLike, now: Date = new Date()): boolean {
  if (!hold.active) return false;
  if (hold.expiresAt && hold.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}
