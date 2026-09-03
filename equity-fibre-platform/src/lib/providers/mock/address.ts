import type {
  AddressCandidate,
  AddressProvider,
  SiteInfo,
} from "@/lib/providers/types";

/**
 * Deterministic synthetic address provider. NO real addresses. The search
 * returns fictional streets; site info is derived deterministically from the
 * place reference so the same address always yields the same result — which
 * makes the demo repeatable.
 *
 * Special demo place refs:
 *   PLACE-ELIGIBLE-*   -> ONT present, inactive > 3 months
 *   PLACE-ACTIVE-*     -> ONT present, active within 3 months (ineligible)
 *   PLACE-NOONT-*      -> no ONT (ineligible)
 *   PLACE-CONFLICT-*   -> indeterminate (manual review)
 */
const SYNTHETIC_STREETS = [
  "Rimu Lane",
  "Kowhai Street",
  "Totara Terrace",
  "Harakeke Road",
  "Pohutukawa Place",
  "Manuka Way",
];

const SYNTHETIC_SUBURBS = ["Riverton", "Kelmarna", "Southbrook", "Te Awa"];

export class MockAddressProvider implements AddressProvider {
  readonly name = "mock-address";

  async searchAddress(query: string): Promise<AddressCandidate[]> {
    const q = query.trim();
    if (q.length < 3) return [];
    // Build a small, stable candidate list seeded by the query.
    const seed = [...q].reduce((a, c) => a + c.charCodeAt(0), 0);
    const kinds = ["ELIGIBLE", "ACTIVE", "NOONT", "CONFLICT"] as const;
    return kinds.map((kind, i) => {
      const num = 10 + ((seed + i * 7) % 80);
      const street = SYNTHETIC_STREETS[(seed + i) % SYNTHETIC_STREETS.length]!;
      const suburb = SYNTHETIC_SUBURBS[(seed + i) % SYNTHETIC_SUBURBS.length]!;
      const label =
        kind === "ELIGIBLE"
          ? "likely eligible"
          : kind === "ACTIVE"
            ? "recently active"
            : kind === "NOONT"
              ? "no fibre"
              : "needs review";
      return {
        placeRef: `PLACE-${kind}-${num}`,
        line1: `${num} ${street}`,
        suburb: `${suburb} (${label})`,
        city: "Demoville",
        postcode: `${7000 + ((seed + i) % 900)}`,
      };
    });
  }

  async getSiteInfo(placeRef: string): Promise<SiteInfo> {
    if (placeRef.startsWith("PLACE-ELIGIBLE")) {
      return { placeRef, hasOnt: true, daysSinceLastActive: 210 };
    }
    if (placeRef.startsWith("PLACE-ACTIVE")) {
      return { placeRef, hasOnt: true, daysSinceLastActive: 20 };
    }
    if (placeRef.startsWith("PLACE-NOONT")) {
      return { placeRef, hasOnt: false, daysSinceLastActive: null };
    }
    if (placeRef.startsWith("PLACE-CONFLICT")) {
      return {
        placeRef,
        hasOnt: true,
        daysSinceLastActive: null,
        indeterminate: true,
      };
    }
    // Default: treat unknown refs as eligible-looking but never active.
    return { placeRef, hasOnt: true, daysSinceLastActive: null };
  }
}
