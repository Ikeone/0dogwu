import type { TransitionMap } from "./stateMachine";

export const SUBSCRIPTION_STATES = [
  "NOT_CREATED",
  "PENDING_ACTIVATION",
  "ACTIVE",
  "PAST_DUE",
  "GRACE_PERIOD",
  "SUSPENDED",
  "CANCELLED",
] as const;

export type SubscriptionState = (typeof SUBSCRIPTION_STATES)[number];

export const SUBSCRIPTION_TRANSITIONS: TransitionMap<SubscriptionState> = {
  NOT_CREATED: ["PENDING_ACTIVATION"],
  PENDING_ACTIVATION: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["PAST_DUE", "CANCELLED"],
  PAST_DUE: ["GRACE_PERIOD", "ACTIVE", "CANCELLED"],
  GRACE_PERIOD: ["ACTIVE", "SUSPENDED", "CANCELLED"],
  SUSPENDED: ["ACTIVE", "CANCELLED"],
  CANCELLED: [],
};
