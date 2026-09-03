import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/services/audit";

const Body = z.object({
  kind: z.enum(["access", "correction", "deletion"]),
  detail: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const request = await prisma.privacyRequest.create({
    data: { userId: user.id, kind: parsed.data.kind, detail: parsed.data.detail ?? "", status: "received" },
  });
  await recordAudit({
    type: "privacy.request",
    actorId: user.id,
    actorLabel: user.email,
    targetType: "privacy_request",
    targetId: request.id,
    metadata: { kind: parsed.data.kind },
  });
  return NextResponse.json({ ok: true, reference: request.id.slice(0, 8) });
}
