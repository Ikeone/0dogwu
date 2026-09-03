import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { approveRequest, rejectRequest, markApplied, SelfApprovalError } from "@/lib/services/approvals";
import { setConfigValue } from "@/lib/services/config";

const Body = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(300).optional(),
});

// Checker side of maker-checker. The approver MUST differ from the requester.
export async function POST(req: Request) {
  return withCapability("config.edit", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    try {
      if (parsed.data.action === "reject") {
        await rejectRequest(parsed.data.id, user.id, user.email, parsed.data.reason ?? "rejected");
        return NextResponse.json({ ok: true, status: "rejected" });
      }
      const { type, payload } = await approveRequest(parsed.data.id, user.id, user.email);
      // Apply the approved change.
      if (type === "config_change") {
        const p = payload as { key: string; value: unknown };
        await setConfigValue(p.key, p.value, `${user.email} (approved)`, "maker-checker approved");
      }
      await markApplied(parsed.data.id);
      return NextResponse.json({ ok: true, status: "applied" });
    } catch (err) {
      if (err instanceof SelfApprovalError) return NextResponse.json({ error: err.message }, { status: 403 });
      return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
    }
  });
}
