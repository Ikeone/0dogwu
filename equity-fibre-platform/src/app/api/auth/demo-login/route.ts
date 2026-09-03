import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { createSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/services/audit";
import { clientIp } from "@/lib/http";

const Body = z.object({ email: z.string().email() });

/**
 * One-click demo login. STRICTLY gated on DEMO_MODE — disabled in production.
 * Demo credentials are documented in docs/DEMO_SCRIPT.md, not exposed here.
 */
export async function POST(req: Request) {
  if (!getEnv().DEMO_MODE) {
    return NextResponse.json({ error: "Demo login is disabled." }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ error: "Unknown demo account." }, { status: 404 });

  await createSession(user.id, await clientIp());
  await recordAudit({ type: "auth.demo_login", actorId: user.id, actorLabel: user.email });
  return NextResponse.json({ ok: true, isStaff: user.isStaff });
}
