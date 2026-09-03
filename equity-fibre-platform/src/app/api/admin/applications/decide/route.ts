import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { resolveManualReview } from "@/lib/services/applications";

const Body = z.object({
  applicationId: z.string().min(1),
  outcome: z.enum(["ELIGIBLE", "INELIGIBLE", "NEEDS_INFORMATION"]),
  reason: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  return withCapability("applications.decide", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    try {
      await resolveManualReview(parsed.data.applicationId, parsed.data.outcome, user.email, parsed.data.reason);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
    }
  });
}
