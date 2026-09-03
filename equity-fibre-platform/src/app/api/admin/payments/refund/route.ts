import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { refundTransaction } from "@/lib/services/payments";

const Body = z.object({ transactionId: z.string().min(1), reason: z.string().min(1).max(300) });

export async function POST(req: Request) {
  return withCapability("payments.refund", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    await refundTransaction(parsed.data.transactionId, user.email, parsed.data.reason);
    return NextResponse.json({ ok: true });
  });
}
