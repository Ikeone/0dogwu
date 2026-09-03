import { NextResponse } from "next/server";
import { requireCapability, AuthError, type SessionUser } from "./session";
import type { Capability } from "./rbac";

/**
 * Wrap an API handler with a server-side capability check. Deny-by-default:
 * returns 401/403 JSON when the caller lacks the capability.
 */
export async function withCapability(
  cap: Capability,
  fn: (user: SessionUser) => Promise<Response>,
): Promise<Response> {
  try {
    const user = await requireCapability(cap);
    return await fn(user);
  } catch (err) {
    if (err instanceof AuthError) {
      const status = err.code === "authentication_required" ? 401 : 403;
      return NextResponse.json({ error: err.code }, { status });
    }
    throw err;
  }
}
