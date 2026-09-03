import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/services/audit";
import { clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";

const Body = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

/**
 * Real customer account creation. Creates a User + CustomerProfile with a
 * scrypt-hashed password, then starts an authenticated session. Email is
 * normalised to lowercase; duplicate emails are rejected without leaking which
 * emails exist beyond the necessary "already registered" signal.
 */
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`register:${ip ?? "x"}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Please check the form.", issues }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists. Try signing in." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      displayName: parsed.data.fullName,
      isStaff: false,
      passwordHash: hashPassword(parsed.data.password),
      customerProfile: { create: { fullName: parsed.data.fullName, contactPref: "email" } },
    },
  });

  await createSession(user.id, ip);
  await recordAudit({ type: "auth.registered", actorId: user.id, actorLabel: user.email });
  return NextResponse.json({ ok: true, isStaff: false });
}
