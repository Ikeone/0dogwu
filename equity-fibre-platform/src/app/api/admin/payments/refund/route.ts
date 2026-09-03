import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { refundTransaction } from "@/lib/services/payments";
import { requireStepUp, AuthError } from "@/lib/auth/session";

const Body = z.object({ transactionId: z.string().min(1), reason: z.string().min(1).max(300) });

// Refunds are financially meaningful: require step-up re-authentication.
export async function POST(req: Request) {
  return withCapability("payments.refund", async (user) => {
    try {
      await requireStepUp();
    } catch (err) {
      if (err instanceof AuthError) return NextResponse.json({ error: "step_up_required" }, { status: 403 });
      throw err;
    }
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    await refundTransaction(parsed.data.transactionId, user.email, parsed.data.reason);
    return NextResponse.json({ ok: true });
  });
}
