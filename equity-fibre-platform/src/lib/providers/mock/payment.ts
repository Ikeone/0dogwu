import { createHmac } from "node:crypto";
import type {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentProvider,
  PaymentWebhookResult,
} from "@/lib/providers/types";
import { getEnv } from "@/lib/config/env";

/**
 * Fully-working mock payment provider.
 *
 * - Never asks for real card details.
 * - Hosted-checkout is simulated by an in-app route (/checkout/[id]).
 * - Webhooks are HMAC-signed with AUTH_SECRET so signature verification and
 *   idempotency can be exercised exactly like a real provider (e.g. Stripe).
 * - Fulfilment is webhook-driven (never from the browser redirect alone).
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock-payment";

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const checkoutId = `mock_cs_${input.idempotencyKey}`;
    return {
      checkoutId,
      redirectUrl: `/checkout/${encodeURIComponent(checkoutId)}?order=${input.serviceOrderId}&kind=${input.kind}&amount=${input.amountCents}`,
    };
  }

  parseWebhook(rawBody: string, signature: string | null): PaymentWebhookResult {
    const expected = signMockWebhook(rawBody);
    if (!signature || signature !== expected) {
      throw new Error("Invalid mock payment webhook signature.");
    }
    const parsed = JSON.parse(rawBody) as {
      externalEventId: string;
      transactionRef: string;
      outcome: PaymentWebhookResult["outcome"];
    };
    return parsed;
  }
}

/** Sign a mock webhook body the same way a provider would (HMAC-SHA256). */
export function signMockWebhook(rawBody: string): string {
  const secret = getEnv().AUTH_SECRET;
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}
