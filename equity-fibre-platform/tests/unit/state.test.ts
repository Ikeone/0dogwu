import { describe, it, expect } from "vitest";
import { canTransition, assertTransition, InvalidTransitionError } from "@/lib/domain/stateMachine";
import { ORDER_TRANSITIONS } from "@/lib/domain/orderState";
import { DEVICE_TRANSITIONS } from "@/lib/domain/deviceState";
import { SUBSCRIPTION_TRANSITIONS } from "@/lib/domain/subscriptionState";
import { APPLICATION_TRANSITIONS } from "@/lib/domain/applicationState";

describe("state machines", () => {
  it("allows valid order transitions", () => {
    expect(canTransition(ORDER_TRANSITIONS, "CREATED", "AWAITING_MODEM_PAYMENT")).toBe(true);
    expect(canTransition(ORDER_TRANSITIONS, "READY_FOR_ACTIVATION", "ACTIVE")).toBe(true);
  });

  it("rejects impossible order transitions", () => {
    expect(canTransition(ORDER_TRANSITIONS, "CREATED", "ACTIVE")).toBe(false);
    expect(() => assertTransition("order", ORDER_TRANSITIONS, "CANCELLED", "ACTIVE")).toThrow(InvalidTransitionError);
  });

  it("enforces device lifecycle order", () => {
    expect(canTransition(DEVICE_TRANSITIONS, "AVAILABLE", "RESERVED")).toBe(true);
    expect(canTransition(DEVICE_TRANSITIONS, "RESERVED", "PACKED")).toBe(true);
    expect(canTransition(DEVICE_TRANSITIONS, "DELIVERED", "ASSIGNED")).toBe(true);
    expect(canTransition(DEVICE_TRANSITIONS, "ASSIGNED", "ACTIVE")).toBe(true);
    // Cannot skip straight from available to active.
    expect(canTransition(DEVICE_TRANSITIONS, "AVAILABLE", "ACTIVE")).toBe(false);
  });

  it("subscription cannot resurrect from cancelled", () => {
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, "CANCELLED", "ACTIVE")).toBe(false);
    expect(canTransition(SUBSCRIPTION_TRANSITIONS, "GRACE_PERIOD", "ACTIVE")).toBe(true);
  });

  it("application terminal states have no exits", () => {
    expect(APPLICATION_TRANSITIONS.INELIGIBLE).toHaveLength(0);
    expect(canTransition(APPLICATION_TRANSITIONS, "CHECKING", "ELIGIBLE")).toBe(true);
  });
});
