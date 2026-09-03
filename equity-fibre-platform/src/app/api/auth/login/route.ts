import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/services/audit";
import { clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`login:${ip ?? "unknown"}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  // Generic failure message (no user enumeration).
  const generic = NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  if (!parsed.success) return generic;

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || user.disabledAt) return generic;
  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    await recordAudit({ type: "auth.login_failed", actorLabel: "anonymous", metadata: { reason: "bad_password" } });
    return generic;
  }
  await createSession(user.id, ip);
  await recordAudit({ type: "auth.login", actorId: user.id, actorLabel: user.email });
  return NextResponse.json({ ok: true, isStaff: user.isStaff });
}
