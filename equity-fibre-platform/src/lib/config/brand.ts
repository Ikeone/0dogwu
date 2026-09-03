/**
 * Brand configuration — single source of truth for the placeholder brand.
 * Replace these values (and colours in tailwind.config.ts) when official
 * Wireless Nation brand assets are supplied (Q48).
 */
export const BRAND = {
  companyName: "Wireless Nation",
  productName: "Equity Fibre",
  // Text-based logo placeholder; swap for an <Image> when a logo is provided.
  wordmark: "Equity Fibre",
  tagline: "Affordable fibre for eligible households",
  supportEmail: "help@equityfibre.example.nz",
  supportPhone: "0800 000 000 (demo)",
  privacyContact: "privacy@equityfibre.example.nz",
} as const;
