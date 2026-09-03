import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request nonce-based Content-Security-Policy.
 *
 * Production: script-src uses a fresh nonce + 'strict-dynamic' (no
 * 'unsafe-inline' for scripts). Next.js automatically applies the nonce to its
 * own scripts because we set the CSP on the request headers.
 *
 * Development: Next's dev runtime needs 'unsafe-eval'/'unsafe-inline', so a
 * relaxed policy is used locally only.
 *
 * style-src retains 'unsafe-inline' because Tailwind/Next inject inline styles;
 * this is documented in docs/SECURITY.md as an accepted, lower-risk exception.
 */
export function middleware(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "connect-src 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads this request header to nonce its own inline bootstrap scripts.
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Apply to all routes except static assets and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
