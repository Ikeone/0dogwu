/**
 * Provider factory — selects concrete adapters from validated environment
 * configuration. This is the only place `new XProvider()` is called. In demo
 * mode everything resolves to mocks. In integration mode, unimplemented real
 * adapters throw a clear error rather than silently falling back to mock.
 */
import { getEnv } from "@/lib/config/env";
import { getModePolicy } from "@/lib/config/mode";
import { logger } from "@/lib/logger";
import type {
  AddressProvider,
  NotificationProvider,
  ObjectStorageProvider,
  PaymentProvider,
  ProvisioningProvider,
  ShippingProvider,
  SupportAIProvider,
} from "./types";

import { MockAddressProvider } from "./mock/address";
import { MockPaymentProvider } from "./mock/payment";
import { MockProvisioningProvider } from "./mock/provisioning";
import { MockShippingProvider } from "./mock/shipping";
import { ConsoleEmailProvider, ConsoleSmsProvider } from "./mock/notifications";
import { LocalObjectStorageProvider } from "./mock/storage";
import { KnowledgeBaseAIProvider } from "./mock/ai";
import { AnthropicSupportProvider } from "./anthropic/ai";

/** Raised when a provider cannot be served safely (no silent fallback). */
export class ProviderDisabledError extends Error {
  constructor(key: string, reason: string) {
    super(`Provider '${key}' is unavailable: ${reason}`);
    this.name = "ProviderDisabledError";
  }
}

/**
 * Guard: a MOCK provider must never serve in PILOT/PRODUCTION. This is the
 * defense-in-depth complement to the startup mode-policy check — even if a
 * misconfiguration slips past startup, requesting a mock here fails closed.
 */
function assertMockAllowed(key: string): void {
  const { systemMode } = getModePolicy();
  if (systemMode === "PILOT" || systemMode === "PRODUCTION") {
    throw new ProviderDisabledError(
      key,
      `mock providers are forbidden in SYSTEM_MODE=${systemMode} (no silent fallback).`,
    );
  }
}

export function getAddressProvider(): AddressProvider {
  const env = getEnv();
  if (env.ADDRESS_PROVIDER === "mock") {
    assertMockAllowed("address");
    return new MockAddressProvider();
  }
  throw new Error(
    "ADDRESS_PROVIDER=chorus is not implemented yet. Implement ChorusAddressProvider (see docs/integrations/chorus.md).",
  );
}

export function getPaymentProvider(): PaymentProvider {
  const env = getEnv();
  if (env.PAYMENT_PROVIDER === "mock") {
    assertMockAllowed("payment");
    return new MockPaymentProvider();
  }
  throw new Error(
    "PAYMENT_PROVIDER=stripe is not implemented yet. Implement StripePaymentProvider (see docs/integrations/payment.md).",
  );
}

export function getProvisioningProvider(): ProvisioningProvider {
  const env = getEnv();
  if (env.PROVISIONING_PROVIDER === "mock") {
    assertMockAllowed("provisioning");
    return new MockProvisioningProvider();
  }
  throw new Error(
    "PROVISIONING_PROVIDER != mock is not implemented yet. Implement the provisioning adapter (see docs/integrations/provisioning.md).",
  );
}

export function getShippingProvider(): ShippingProvider {
  const env = getEnv();
  if (env.SHIPPING_PROVIDER === "mock") {
    assertMockAllowed("shipping");
    return new MockShippingProvider();
  }
  throw new Error("SHIPPING_PROVIDER=courier is not implemented yet.");
}

export function getEmailProvider(): NotificationProvider {
  const env = getEnv();
  if (env.EMAIL_PROVIDER === "console") return new ConsoleEmailProvider();
  throw new Error("EMAIL_PROVIDER=smtp is not implemented yet.");
}

export function getSmsProvider(): NotificationProvider {
  const env = getEnv();
  if (env.SMS_PROVIDER === "console") return new ConsoleSmsProvider();
  throw new Error("SMS_PROVIDER=http is not implemented yet.");
}

export function getObjectStorageProvider(): ObjectStorageProvider {
  const env = getEnv();
  if (env.OBJECT_STORAGE_PROVIDER === "local") return new LocalObjectStorageProvider();
  throw new Error("OBJECT_STORAGE_PROVIDER=s3 is not implemented yet.");
}

export function getSupportAIProvider(): SupportAIProvider {
  const env = getEnv();
  if (env.AI_PROVIDER === "knowledge_base") return new KnowledgeBaseAIProvider();
  if (env.AI_PROVIDER === "anthropic") return new AnthropicSupportProvider();
  throw new Error(`Unknown AI_PROVIDER: ${env.AI_PROVIDER}`);
}

let logged = false;
/** Log provider names once at startup (never credentials). */
export function logProviderStartup(): void {
  if (logged) return;
  logged = true;
  const env = getEnv();
  logger.info("providers.selected", {
    demoMode: env.DEMO_MODE,
    address: env.ADDRESS_PROVIDER,
    payment: env.PAYMENT_PROVIDER,
    provisioning: env.PROVISIONING_PROVIDER,
    shipping: env.SHIPPING_PROVIDER,
    email: env.EMAIL_PROVIDER,
    sms: env.SMS_PROVIDER,
    ai: env.AI_PROVIDER,
    storage: env.OBJECT_STORAGE_PROVIDER,
  });
}
