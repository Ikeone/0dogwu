import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { importModems, type ModemImportRow } from "@/lib/services/modems";

const Row = z.object({
  assetId: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  wanMac: z.string().min(1),
  supplierBatch: z.string().optional(),
});
const Body = z.object({ csv: z.string().optional(), rows: z.array(Row).optional() });

/** Parse a simple CSV: assetId,manufacturer,model,serialNumber,wanMac,supplierBatch */
function parseCsv(csv: string): ModemImportRow[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const rows: ModemImportRow[] = [];
  for (const line of lines) {
    const cols = line.split(",").map((c) => c.trim());
    if (cols[0]?.toLowerCase() === "assetid") continue; // header
    if (cols.length < 5) continue;
    rows.push({
      assetId: cols[0]!, manufacturer: cols[1]!, model: cols[2]!,
      serialNumber: cols[3]!, wanMac: cols[4]!, supplierBatch: cols[5],
    });
  }
  return rows;
}

export async function POST(req: Request) {
  return withCapability("inventory.manage", async () => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const rows = parsed.data.rows ?? (parsed.data.csv ? parseCsv(parsed.data.csv) : []);
    if (rows.length === 0) return NextResponse.json({ error: "No rows to import." }, { status: 400 });
    const result = await importModems(rows);
    return NextResponse.json({ ok: true, ...result });
  });
}
