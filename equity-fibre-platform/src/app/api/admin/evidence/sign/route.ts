import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withCapability } from "@/lib/auth/apiGuard";
import { getObjectStorageProvider } from "@/lib/providers/factory";
import { recordAudit } from "@/lib/services/audit";

const Body = z.object({ evidenceId: z.string().min(1) });

/** Issue a short-lived signed link to view evidence. Access is audited. */
export async function POST(req: Request) {
  return withCapability("evidence.access", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const evidence = await prisma.eligibilityEvidence.findUnique({ where: { id: parsed.data.evidenceId } });
    if (!evidence) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const url = await getObjectStorageProvider().getSignedUrl(evidence.storageKey, 120);
    await recordAudit({
      type: "evidence.access",
      actorId: user.id,
      actorLabel: user.email,
      targetType: "evidence",
      targetId: evidence.id,
      metadata: { ttlSeconds: 120 },
    });
    return NextResponse.json({ url, expiresInSeconds: 120 });
  });
}
