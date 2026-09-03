/**
 * Server-side session management.
 *
 * DEMO NOTE: This is a deliberately small, honest session implementation
 * (random opaque token, SHA-256 hashed at rest, HttpOnly+SameSite cookie,
 * absolute + idle expiry, id rotation on login). It is NOT a full IdP. For
 * production, replace with an established auth library + MFA for staff — see
 * docs/SECURITY.md and open question Q46/Q50. Passwords (staff) use scrypt.
 */
import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { parseRoles, hasCapability, type Capability, type StaffRole } from "./rbac";
import { hashToken, hashPassword, verifyPassword } from "./password";

export { hashPassword, verifyPassword };

const IDLE_MS = 1000 * 60 * 60 * 2; // 2 hours idle
const ABSOLUTE_MS = 1000 * 60 * 60 * 12; // 12 hours absolute

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  isStaff: boolean;
  roles: StaffRole[];
}

/** Create a session and set the cookie. Rotates any previous cookie value. */
export async function createSession(userId: string, ip?: string | null): Promise<void> {
  const env = getEnv();
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ABSOLUTE_MS),
      ip: ip ?? null,
    },
  });
  const jar = await cookies();
  jar.set(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_ENV === "production",
    path: "/",
    maxAge: Math.floor(ABSOLUTE_MS / 1000),
  });
}

export async function destroySession(): Promise<void> {
  const env = getEnv();
  const jar = await cookies();
  const token = jar.get(env.SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    jar.delete(env.SESSION_COOKIE_NAME);
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const env = getEnv();
  const jar = await cookies();
  const token = jar.get(env.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  const now = Date.now();
  const idleExpired = now - session.lastSeenAt.getTime() > IDLE_MS;
  const absoluteExpired = session.expiresAt.getTime() < now;
  if (idleExpired || absoluteExpired || session.user.disabledAt) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  // Touch last-seen (idle timeout sliding window).
  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    isStaff: session.user.isStaff,
    roles: parseRoles(session.user.roles),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("authentication_required");
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isStaff) throw new AuthError("staff_required");
  return user;
}

export async function requireCapability(cap: Capability): Promise<SessionUser> {
  const user = await requireStaff();
  if (!hasCapability(user.roles, cap)) throw new AuthError("forbidden");
  return user;
}

export class AuthError extends Error {
  constructor(public readonly code: "authentication_required" | "staff_required" | "forbidden") {
    super(code);
    this.name = "AuthError";
  }
}
