/**
 * Billing-trigger logic. Keeps modem payment and monthly billing as separate
 * business events. Monthly billing must NOT begin merely because the modem was
 * delivered unless explicitly configured (Q29).
 */
import type {
  BusinessConfig,
  MonthlyBillingTrigger,
} from "@/lib/config/business";

export type OrderLifecycleEvent =
  | "MODEM_DELIVERED"
  | "SERVICE_ACTIVATED"
  | "MANUAL_APPROVAL";

const EVENT_FOR_TRIGGER: Record<MonthlyBillingTrigger, OrderLifecycleEvent> = {
  SERVICE_ACTIVATION: "SERVICE_ACTIVATED",
  MODEM_DELIVERY: "MODEM_DELIVERED",
  MANUAL_APPROVAL: "MANUAL_APPROVAL",
};

/** Should monthly billing start given this lifecycle event and config? */
export function shouldStartMonthlyBilling(
  event: OrderLifecycleEvent,
  cfg: BusinessConfig,
): boolean {
  return EVENT_FOR_TRIGGER[cfg.billing.monthlyBillingTrigger] === event;
}

/** Should the upfront modem payment be collected at this shipment stage? */
export function shouldCollectModemPayment(
  stage: "BEFORE_SHIPMENT" | "ON_SHIPMENT" | "ON_DELIVERY",
  cfg: BusinessConfig,
): boolean {
  return cfg.billing.modemPaymentTrigger === stage;
}
