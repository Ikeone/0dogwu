import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff, AuthError } from "@/lib/auth/session";
import { confirmEnrollment } from "@/lib/auth/mfa";

const Body = z.object({ secret: z.string().min(16), token: z.string().min(6).max(8) });

export async function POST(req: Request) {
  try {
    const user = await requireStaff();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const recoveryCodes = await confirmEnrollment(user.id, parsed.data.secret, parsed.data.token);
    // Recovery codes are shown ONCE; only hashes are stored.
    return NextResponse.json({ ok: true, recoveryCodes });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.code }, { status: 401 });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
