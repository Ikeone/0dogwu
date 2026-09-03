import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { setConfigValue } from "@/lib/services/config";
import { RUNTIME_CONFIG_KEYS } from "@/lib/config/business";

const Body = z.object({
  key: z.enum(RUNTIME_CONFIG_KEYS as unknown as [string, ...string[]]),
  value: z.unknown(),
  reason: z.string().min(1).max(300),
});

export async function POST(req: Request) {
  return withCapability("config.edit", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    await setConfigValue(parsed.data.key, parsed.data.value, user.email, parsed.data.reason);
    return NextResponse.json({ ok: true });
  });
}
