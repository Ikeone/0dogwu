/**
 * Chorus HTTP client scaffold + OAuth2 client-credentials auth interface.
 *
 * IMPORTANT: This does NOT contain real Chorus endpoint paths, product ids,
 * or payload shapes. Those are unknown (see docs/integrations/chorus.md and
 * open questions Q16-Q18). A future engineer fills in ENDPOINTS and the DTO
 * mappings in ./mapping.ts, provides credentials, and the rest of the app is
 * unchanged.
 *
 * The client demonstrates: token acquisition/caching, base-URL usage, timeout,
 * correlation id + idempotency key headers, and redaction of payloads in logs.
 */
import { getEnv } from "@/lib/config/env";
import { logger } from "@/lib/logger";

export interface ChorusAuth {
  getAccessToken(): Promise<string>;
}

/** OAuth2 client-credentials token provider with in-memory caching. */
export class ChorusClientCredentialsAuth implements ChorusAuth {
  private token: { value: string; expiresAt: number } | null = null;

  async getAccessToken(): Promise<string> {
    const env = getEnv();
    if (!env.CHORUS_TOKEN_URL || !env.CHORUS_CLIENT_ID || !env.CHORUS_CLIENT_SECRET) {
      throw new Error("Chorus credentials are not configured (CHORUS_* env vars).");
    }
    if (this.token && this.token.expiresAt > Date.now() + 30_000) {
      return this.token.value;
    }
    // Placeholder token request. Fill in exact grant/scope when documented.
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.CHORUS_CLIENT_ID,
      client_secret: env.CHORUS_CLIENT_SECRET,
      ...(env.CHORUS_SCOPE ? { scope: env.CHORUS_SCOPE } : {}),
    });
    const resp = await fetch(env.CHORUS_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!resp.ok) throw new Error(`Chorus token request failed: ${resp.status}`);
    const json = (await resp.json()) as { access_token: string; expires_in: number };
    this.token = {
      value: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    return this.token.value;
  }
}

/**
 * Where all Chorus endpoint paths belong. Deliberately empty — do not invent.
 * Populate from the official RAML/OpenAPI once available.
 */
export const CHORUS_ENDPOINTS: Record<string, string> = {
  // searchAddress: "/geographicAddress",         // EXAMPLE ONLY — confirm
  // getSite: "/site/{id}",                        // EXAMPLE ONLY — confirm
  // createOrder: "/productOrder",                 // EXAMPLE ONLY — confirm
};

export interface ChorusRequestContext {
  correlationId: string;
  idempotencyKey?: string;
}

export class ChorusHttpClient {
  constructor(private readonly auth: ChorusAuth) {}

  async request<T>(
    method: string,
    endpointKey: keyof typeof CHORUS_ENDPOINTS,
    ctx: ChorusRequestContext,
    body?: unknown,
  ): Promise<T> {
    const env = getEnv();
    const path = CHORUS_ENDPOINTS[endpointKey as string];
    if (!env.CHORUS_BASE_URL || !path) {
      throw new Error(
        `Chorus endpoint '${String(endpointKey)}' is not mapped yet. See docs/integrations/chorus.md.`,
      );
    }
    const token = await this.auth.getAccessToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      // NOTE: we log only the correlation id and status — never the payload.
      logger.info("chorus.request", { method, endpointKey, correlationId: ctx.correlationId });
      const resp = await fetch(`${env.CHORUS_BASE_URL}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-correlation-id": ctx.correlationId,
          ...(ctx.idempotencyKey ? { "idempotency-key": ctx.idempotencyKey } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!resp.ok) {
        const err = new Error(`Chorus request failed: ${resp.status}`);
        (err as { status?: number }).status = resp.status;
        throw err;
      }
      return (await resp.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
