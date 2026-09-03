import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { resolveHardshipCase, resolveDispute } from "@/lib/services/hardship";
import { previewSuspension, evaluateSuspension } from "@/lib/services/suspension";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("resolve_hardship"), caseId: z.string().min(1), status: z.enum(["resolved", "declined"]) }),
  z.object({ action: z.literal("resolve_dispute"), disputeId: z.string().min(1), status: z.enum(["upheld", "rejected", "resolved"]) }),
  z.object({ action: z.literal("preview_suspension"), serviceOrderId: z.string().min(1) }),
  z.object({ action: z.literal("suspend"), serviceOrderId: z.string().min(1), reason: z.string().min(3).max(200) }),
]);

export async function POST(req: Request) {
  return withCapability("hardship.handle", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const d = parsed.data;
    if (d.action === "resolve_hardship") {
      await resolveHardshipCase(d.caseId, d.status, user.email, user.id);
      return NextResponse.json({ ok: true });
    }
    if (d.action === "resolve_dispute") {
      await resolveDispute(d.disputeId, d.status, user.email, user.id);
      return NextResponse.json({ ok: true });
    }
    if (d.action === "preview_suspension") {
      const result = await previewSuspension(d.serviceOrderId);
      return NextResponse.json({ ok: true, result });
    }
    // Manual suspension still runs through the safety guard (holds block it).
    const result = await evaluateSuspension(d.serviceOrderId, { trigger: `manual:${d.reason}`, actorLabel: user.email });
    return NextResponse.json({ ok: true, result });
  });
}
