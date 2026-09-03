import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, elevateCurrentSession, AuthError } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTotp } from "@/lib/auth/mfa";
import { rateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/http";

const Body = z.object({ password: z.string().optional(), token: z.string().optional() });

/**
 * Step-up (re-authentication) for sensitive operations. Verifies a password
 * and/or TOTP for the current user and elevates the session for a short window.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const ip = await clientIp();
    if (!rateLimit(`stepup:${user.id}:${ip ?? "x"}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
    }
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    let ok = false;
    if (parsed.data.token) ok = await verifyTotp(user.id, parsed.data.token);
    if (!ok && parsed.data.password && record.passwordHash) {
      ok = verifyPassword(parsed.data.password, record.passwordHash);
    }
    if (!ok) return NextResponse.json({ error: "Verification failed." }, { status: 401 });

    await elevateCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.code }, { status: 401 });
    throw err;
  }
}
