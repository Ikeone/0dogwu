import { NextResponse } from "next/server";
import { z } from "zod";
import { askSupport } from "@/lib/services/support";
import { getSessionUser } from "@/lib/auth/session";
import { clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";

const Body = z.object({ question: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  const ip = await clientIp();
  // Rate-limit per customer AND per IP.
  const key = user ? `ask:u:${user.id}` : `ask:ip:${ip ?? "x"}`;
  if (!rateLimit(key, 20, 60_000) || !rateLimit(`ask:ip:${ip ?? "x"}`, 40, 60_000)) {
    return NextResponse.json({ error: "You're sending messages too quickly. Please wait a moment." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please enter a question." }, { status: 400 });

  const result = await askSupport(parsed.data.question, user?.id ?? null);
  return NextResponse.json(result);
}
