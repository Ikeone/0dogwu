import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { runDemoEvent, DEMO_EVENTS, type DemoEvent } from "@/lib/services/demo";

const Body = z.object({
  event: z.enum(DEMO_EVENTS as unknown as [DemoEvent, ...DemoEvent[]]),
  orderId: z.string().min(1),
});

export async function POST(req: Request) {
  return withCapability("demo.control", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    try {
      const result = await runDemoEvent(parsed.data.event, parsed.data.orderId, user.email);
      return NextResponse.json({ ok: true, result });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
    }
  });
}
