import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withCapability } from "@/lib/auth/apiGuard";
import { recordAudit } from "@/lib/services/audit";

const Body = z.object({
  ticketId: z.string().min(1),
  action: z.enum(["take_over", "resolve"]),
  category: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  return withCapability("support.handle", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const { ticketId, action, category } = parsed.data;
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data:
        action === "resolve"
          ? { status: "resolved", resolvedAt: new Date(), ...(category ? { category } : {}) }
          : { status: "in_progress", assignedToId: user.id },
    });
    await recordAudit({
      type: action === "resolve" ? "support.resolved" : "support.taken_over",
      actorId: user.id,
      actorLabel: user.email,
      targetType: "ticket",
      targetId: ticketId,
    });
    return NextResponse.json({ ok: true });
  });
}
