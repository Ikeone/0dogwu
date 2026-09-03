/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// Content-Security-Policy applied to every response.
// KNOWN LIMITATION (docs/DECISIONS.md D8, docs/SECURITY_LIMITATIONS.md):
// Next.js App Router streams RSC via INLINE <script> tags, which require either
// 'unsafe-inline' or a per-request nonce. A nonce with 'strict-dynamic' was
// trialled but it requires fully dynamic rendering and broke statically-
// generated pages (blank page on direct navigation). To keep the app reliably
// working, scripts allow 'unsafe-inline'. A proper nonce/hash CSP (with all
// interactive routes rendered dynamically) is a documented follow-up.
// Non-script protections remain strict: object-src 'none', frame-ancestors
// 'none', base-uri 'self', form-action 'self'. Plus X-Frame-Options, HSTS, etc.
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "connect-src 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
