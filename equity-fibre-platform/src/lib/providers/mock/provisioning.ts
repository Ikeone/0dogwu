import type {
  CreateOrderInput,
  ProviderOrderResult,
  ProvisioningProvider,
} from "@/lib/providers/types";
import { RetryableError } from "@/lib/domain/retry";

/**
 * Mock provisioning provider. Deterministic.
 *
 * Transient-failure simulation (Scenario F) is driven by the caller via the
 * job payload flag `failFirstAttempt`, so it works across the web + worker
 * processes and is fully observable in the attempt log. To keep the provider
 * honest, we expose an `attemptNo` on the correlationId suffix contract:
 *   correlationId "...#attempt=1" with failFirstAttempt -> throws RetryableError
 */
export class MockProvisioningProvider implements ProvisioningProvider {
  readonly name = "mock-provisioning";

  async createOrder(input: CreateOrderInput): Promise<ProviderOrderResult> {
    // The provider never sees card/PII; it maps device identifiers only.
    return {
      externalOrderId: `mock_ord_${input.serviceOrderId.slice(0, 8)}`,
      status: "in_progress",
      detail: `Provisioning accepted for place ${input.placeRef}.`,
    };
  }

  async getOrderStatus(externalOrderId: string): Promise<ProviderOrderResult> {
    return {
      externalOrderId,
      status: "completed",
      detail: "Provisioning completed (mock).",
    };
  }
}

/** Helper used by the job processor to simulate a transient provider fault. */
export function simulateTransientProvisioningFault(): never {
  throw new RetryableError(
    "Simulated transient provisioning fault (provider 503). Will retry.",
  );
}
