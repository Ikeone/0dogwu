/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// Security headers applied to every response. CSP is intentionally strict;
// 'unsafe-inline' for styles is required by Tailwind's runtime in dev and by
// Next's inlined styles. Scripts avoid unsafe-inline in production.
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  isProd
    ? "script-src 'self'"
    : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
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
