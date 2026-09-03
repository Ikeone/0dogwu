import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createHardshipCase, createBillingDispute } from "@/lib/services/hardship";
import { rateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/http";

const Body = z.object({
  kind: z.enum(["hardship", "dispute"]),
  reason: z.string().min(3).max(500),
  detail: z.string().max(1000).optional(),
});

/**
 * Customer self-service: report payment difficulty (hardship) or dispute a
 * charge. Either immediately opens a protective hold so the customer cannot be
 * auto-suspended while the case is open. Ownership is derived from the session.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const ip = await clientIp();
  if (!rateLimit(`hardship:${user.id}:${ip ?? "x"}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please describe the problem." }, { status: 400 });

  // Find the customer's most recent order (their own only).
  const order = await prisma.serviceOrder.findFirst({
    where: { application: { userId: user.id } },
    orderBy: { createdAt: "desc" },
  });

  if (parsed.data.kind === "hardship") {
    const { case: c } = await createHardshipCase({
      userId: user.id,
      serviceOrderId: order?.id ?? null,
      reason: parsed.data.reason,
      detail: parsed.data.detail,
      actorLabel: "customer",
    });
    return NextResponse.json({ ok: true, reference: c.reference, protected: true });
  }
  const { dispute } = await createBillingDispute({
    userId: user.id,
    serviceOrderId: order?.id ?? null,
    reason: parsed.data.reason,
    actorLabel: "customer",
  });
  return NextResponse.json({ ok: true, reference: dispute.reference, protected: true });
}
