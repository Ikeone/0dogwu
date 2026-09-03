import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { importModems } from "@/lib/services/modems";

const Body = z.object({
  assetId: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  wanMac: z.string().min(1),
  supplierBatch: z.string().optional(),
});

export async function POST(req: Request) {
  return withCapability("inventory.manage", async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const result = await importModems([parsed.data]);
    if (result.imported === 0) {
      return NextResponse.json({ error: result.skipped[0]?.reason ?? "Rejected." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, ...result });
  });
}
