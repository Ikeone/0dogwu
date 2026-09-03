import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { setConfigValue } from "@/lib/services/config";
import { RUNTIME_CONFIG_KEYS } from "@/lib/config/business";
import { requireStepUp, AuthError } from "@/lib/auth/session";
import { createApprovalRequest, requiresMakerChecker } from "@/lib/services/approvals";

const Body = z.object({
  key: z.enum(RUNTIME_CONFIG_KEYS as unknown as [string, ...string[]]),
  value: z.unknown(),
  reason: z.string().min(1).max(300),
});

// High-risk configuration change. Requires step-up, and in PILOT/PRODUCTION a
// separate approver (maker-checker) before it takes effect.
export async function POST(req: Request) {
  return withCapability("config.edit", async (user) => {
    try {
      await requireStepUp();
    } catch (err) {
      if (err instanceof AuthError) return NextResponse.json({ error: "step_up_required" }, { status: 403 });
      throw err;
    }
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    if (requiresMakerChecker()) {
      const reqRow = await createApprovalRequest(
        "config_change",
        { key: parsed.data.key, value: parsed.data.value },
        user.id,
        user.email,
        parsed.data.reason,
      );
      return NextResponse.json({ ok: true, pendingApprovalId: reqRow.id, status: "pending_approval" });
    }

    await setConfigValue(parsed.data.key, parsed.data.value, user.email, parsed.data.reason);
    return NextResponse.json({ ok: true, status: "applied" });
  });
}
