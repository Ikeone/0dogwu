import { NextResponse } from "next/server";
import { getAddressProvider } from "@/lib/providers/factory";
import { rateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/http";

export async function GET(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`addr:${ip ?? "x"}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json({ candidates: [] });
  const candidates = await getAddressProvider().searchAddress(q);
  // Also return the site info so the wizard can show the availability result.
  const provider = getAddressProvider();
  const withSite = await Promise.all(
    candidates.map(async (c) => ({ ...c, site: await provider.getSiteInfo(c.placeRef) })),
  );
  return NextResponse.json({ candidates: withSite });
}
