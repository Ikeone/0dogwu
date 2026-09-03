import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/config/env";
import { prisma } from "@/lib/db";
import { runDemoEvent } from "@/lib/services/demo";

const Body = z.object({
  orderId: z.string().min(1),
  outcome: z.enum(["succeeded", "failed", "abandoned"]),
});

/**
 * Simulated hosted-checkout outcome (DEMO ONLY). success/failure go through the
 * signed mock-webhook path (real fulfilment code); abandon marks the pending
 * transaction abandoned without charging.
 */
export async function POST(req: Request) {
  if (!getEnv().DEMO_MODE) {
    return NextResponse.json({ error: "Disabled outside demo mode." }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { orderId, outcome } = parsed.data;

  if (outcome === "abandoned") {
    await prisma.paymentTransaction.updateMany({
      where: { serviceOrderId: orderId, kind: "modem_upfront", status: "pending" },
      data: { status: "abandoned" },
    });
    return NextResponse.json({ ok: true, outcome });
  }

  const result = await runDemoEvent(
    outcome === "succeeded" ? "payment_successful" : "payment_failed",
    orderId,
    "customer",
  );
  return NextResponse.json({ ok: true, outcome, result });
}
