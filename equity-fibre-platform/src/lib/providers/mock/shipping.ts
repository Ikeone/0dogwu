import { randomBytes } from "node:crypto";
import type {
  CreateShipmentInput,
  ShipmentResult,
  ShippingProvider,
} from "@/lib/providers/types";

export class MockShippingProvider implements ShippingProvider {
  readonly name = "mock-courier";

  async createShipment(_input: CreateShipmentInput): Promise<ShipmentResult> {
    const tracking = `WN${randomBytes(4).toString("hex").toUpperCase()}`;
    return { trackingRef: tracking, carrier: "mock-courier" };
  }
}
