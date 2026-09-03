import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { createHold, closeHold } from "@/lib/services/holds";
import { HOLD_TYPES, type HoldType } from "@/lib/domain/holds";
import { prisma } from "@/lib/db";

const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    userId: z.string().min(1),
    serviceOrderId: z.string().optional(),
    holdType: z.enum(HOLD_TYPES as unknown as [HoldType, ...HoldType[]]),
    reason: z.string().min(3).max(300),
    expiresInDays: z.number().int().positive().max(365).optional(),
  }),
  z.object({ action: z.literal("close"), holdId: z.string().min(1), reason: z.string().min(3).max(300) }),
]);

export async function POST(req: Request) {
  return withCapability("holds.manage", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    if (parsed.data.action === "create") {
      // If a serviceOrderId is given without userId match, resolve the owner.
      let userId = parsed.data.userId;
      if (parsed.data.serviceOrderId) {
        const order = await prisma.serviceOrder.findUnique({
          where: { id: parsed.data.serviceOrderId },
          include: { application: true },
        });
        if (order?.application.userId) userId = order.application.userId;
      }
      const hold = await createHold({
        userId,
        serviceOrderId: parsed.data.serviceOrderId ?? null,
        holdType: parsed.data.holdType,
        reason: parsed.data.reason,
        createdById: user.id,
        createdByLabel: user.email,
        expiresAt: parsed.data.expiresInDays ? new Date(Date.now() + parsed.data.expiresInDays * 86400_000) : null,
      });
      return NextResponse.json({ ok: true, holdId: hold.id });
    }
    await closeHold(parsed.data.holdId, user.email, parsed.data.reason, user.id);
    return NextResponse.json({ ok: true });
  });
}
