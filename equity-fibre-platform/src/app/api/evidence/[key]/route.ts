import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/config/env";
import { requireCapability, AuthError } from "@/lib/auth/session";
import { LocalObjectStorageProvider, safeKey } from "@/lib/providers/mock/storage";
import { recordAudit } from "@/lib/services/audit";

/**
 * Serve decrypted evidence via a time-limited signed link. Requires BOTH a
 * valid signature/expiry AND the evidence.access capability (defence in depth).
 * Files are NEVER served from the public static directory.
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const url = new URL(req.url);
  const exp = Number(url.searchParams.get("exp") ?? "0");
  const sig = url.searchParams.get("sig") ?? "";

  try {
    safeKey(key);
  } catch {
    return NextResponse.json({ error: "Bad key." }, { status: 400 });
  }
  if (Date.now() > exp) return NextResponse.json({ error: "Link expired." }, { status: 403 });
  const expected = createHash("sha256").update(`${key}.${exp}.${getEnv().AUTH_SECRET}`).digest("hex").slice(0, 32);
  if (sig !== expected) return NextResponse.json({ error: "Invalid signature." }, { status: 403 });

  let user;
  try {
    user = await requireCapability("evidence.access");
  } catch (err) {
    const status = err instanceof AuthError && err.code === "authentication_required" ? 401 : 403;
    return NextResponse.json({ error: "Forbidden." }, { status });
  }

  const evidence = await prisma.eligibilityEvidence.findFirst({ where: { storageKey: key } });
  if (!evidence) return NextResponse.json({ error: "Not found." }, { status: 404 });
  // In production, block download until malware scan is clean.
  if (getEnv().APP_ENV === "production" && evidence.malwareState !== "clean") {
    return NextResponse.json({ error: "File not available yet." }, { status: 409 });
  }

  const bytes = await new LocalObjectStorageProvider().read(key);
  await recordAudit({
    type: "evidence.download",
    actorId: user.id,
    actorLabel: user.email,
    targetType: "evidence",
    targetId: evidence.id,
  });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": evidence.detectedMime,
      "content-disposition": `inline; filename="${evidence.safeName}"`,
      "cache-control": "private, no-store",
    },
  });
}
