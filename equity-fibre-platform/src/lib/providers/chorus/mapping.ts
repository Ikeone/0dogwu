/**
 * Provider-DTO <-> domain-DTO mapping seam for Chorus.
 *
 * This is the ONE place where Chorus response shapes are translated into the
 * domain types in src/lib/providers/types.ts. Everything above the provider
 * layer depends on domain types only.
 *
 * The functions below are stubs with the intended signatures. Implement them
 * from the official Chorus API documentation (Q16-Q18). Keeping them here means
 * a future engineer changes only this file + client.ts + a ChorusProvider that
 * implements the domain interfaces.
 */
import type { AddressCandidate, SiteInfo } from "@/lib/providers/types";

// Replace `unknown` with the real Chorus DTOs once documented.
export function mapAddressSearch(_raw: unknown): AddressCandidate[] {
  throw new Error("mapAddressSearch: implement from Chorus geographicAddress DTO.");
}

export function mapSiteInfo(_raw: unknown): SiteInfo {
  throw new Error("mapSiteInfo: implement from Chorus site/ONT DTO.");
}
