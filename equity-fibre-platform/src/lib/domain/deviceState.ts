import type { TransitionMap } from "./stateMachine";

export const DEVICE_STATES = [
  "RECEIVED",
  "AVAILABLE",
  "RESERVED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "ASSIGNED",
  "ACTIVE",
  "RETURN_PENDING",
  "RETURNED",
  "FAULTY",
  "LOST",
  "RETIRED",
] as const;

export type DeviceState = (typeof DEVICE_STATES)[number];

export const DEVICE_TRANSITIONS: TransitionMap<DeviceState> = {
  RECEIVED: ["AVAILABLE", "FAULTY", "RETIRED"],
  AVAILABLE: ["RESERVED", "FAULTY", "RETIRED"],
  RESERVED: ["PACKED", "AVAILABLE"], // release back to AVAILABLE on reservation expiry
  PACKED: ["SHIPPED", "AVAILABLE"],
  SHIPPED: ["DELIVERED", "LOST"],
  DELIVERED: ["ASSIGNED", "RETURN_PENDING"],
  ASSIGNED: ["ACTIVE", "RETURN_PENDING", "FAULTY"],
  ACTIVE: ["RETURN_PENDING", "FAULTY"],
  RETURN_PENDING: ["RETURNED", "ACTIVE"],
  RETURNED: ["AVAILABLE", "RETIRED"],
  FAULTY: ["RETURNED", "RETIRED"],
  LOST: ["RETIRED"],
  RETIRED: [],
};
