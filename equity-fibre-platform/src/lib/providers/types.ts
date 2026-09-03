/**
 * Domain-facing provider interfaces.
 *
 * The domain layer depends ONLY on these interfaces — never on Chorus/Stripe/
 * courier-specific DTOs. Concrete adapters (mock, chorus, stripe, ...) map
 * provider payloads to these types in their own package. This is the seam a
 * future engineer implements once real API docs + credentials arrive.
 */

// ---- Address / availability -------------------------------------------------

export interface AddressCandidate {
  placeRef: string; // provider place/location identifier
  line1: string;
  suburb: string;
  city: string;
  postcode: string;
}

export interface SiteInfo {
  placeRef: string;
  hasOnt: boolean;
  /** Days since last known fibre activity; null = never active. */
  daysSinceLastActive: number | null;
  /** Provider could not give a definitive answer (route to manual review). */
  indeterminate?: boolean;
}

export interface AddressProvider {
  readonly name: string;
  searchAddress(query: string): Promise<AddressCandidate[]>;
  getSiteInfo(placeRef: string): Promise<SiteInfo>;
}

// ---- Provisioning -----------------------------------------------------------

export interface CreateOrderInput {
  serviceOrderId: string;
  placeRef: string;
  planCode: string;
  wanMac: string;
  serialNumber: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface ProviderOrderResult {
  externalOrderId: string;
  status: "accepted" | "in_progress" | "blocked" | "completed";
  detail: string;
}

export interface ProvisioningProvider {
  readonly name: string;
  createOrder(input: CreateOrderInput): Promise<ProviderOrderResult>;
  getOrderStatus(externalOrderId: string): Promise<ProviderOrderResult>;
}

// ---- Payments ---------------------------------------------------------------

export interface CreateCheckoutInput {
  serviceOrderId: string;
  kind: "modem_upfront" | "monthly";
  amountCents: number;
  currency: string;
  idempotencyKey: string;
}

export interface CheckoutSession {
  checkoutId: string;
  // For hosted providers this is a redirect URL. For mock it's an in-app route.
  redirectUrl: string;
}

export interface PaymentWebhookResult {
  externalEventId: string;
  transactionRef: string;
  outcome: "succeeded" | "failed" | "abandoned" | "refunded";
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  /** Parse+verify a provider webhook. Signature verification lives here. */
  parseWebhook(rawBody: string, signature: string | null): PaymentWebhookResult;
}

// ---- Shipping ---------------------------------------------------------------

export interface CreateShipmentInput {
  serviceOrderId: string;
  addressLine: string;
  idempotencyKey: string;
}

export interface ShipmentResult {
  trackingRef: string;
  carrier: string;
}

export interface ShippingProvider {
  readonly name: string;
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
}

// ---- Notifications ----------------------------------------------------------

export interface NotificationInput {
  to: string; // email or phone (kept server-side, redacted in previews)
  template: string;
  subject: string;
  data: Record<string, string>;
}

export interface NotificationProvider {
  readonly name: string;
  readonly channel: "email" | "sms";
  send(input: NotificationInput): Promise<{ preview: string }>;
}

// ---- Object storage ---------------------------------------------------------

export interface StoredObject {
  storageKey: string;
  integrityHash: string;
  sizeBytes: number;
}

export interface ObjectStorageProvider {
  readonly name: string;
  put(bytes: Buffer, contentType: string): Promise<StoredObject>;
  /** Time-limited signed access; never returns a public URL. */
  getSignedUrl(storageKey: string, ttlSeconds: number): Promise<string>;
  delete(storageKey: string): Promise<void>;
}

// ---- AI support -------------------------------------------------------------

export interface KnowledgeHit {
  id: string;
  slug: string;
  title: string;
  score: number;
  excerpt: string;
}

export interface SupportAnswer {
  answer: string;
  confident: boolean;
  citations: { id: string; title: string }[];
  shouldEscalate: boolean;
  escalationReason?: string;
}

export interface SupportAIProvider {
  readonly name: string;
  answer(question: string, hits: KnowledgeHit[]): Promise<SupportAnswer>;
}
