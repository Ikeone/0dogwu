import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import {
  getMyApplicationStatus,
  getMyOrderStatus,
  getMyShipmentStatus,
  getMyServiceStatus,
  getMyNextPaymentDate,
} from "@/lib/services/support";

/**
 * Account-aware, read-only status tools. Identity is derived from the
 * authenticated session — the caller cannot supply an arbitrary customer id.
 * These tools ONLY read the requesting user's own records.
 */
const TOOLS = {
  get_my_application_status: getMyApplicationStatus,
  get_my_order_status: getMyOrderStatus,
  get_my_shipment_status: getMyShipmentStatus,
  get_my_service_status: getMyServiceStatus,
  get_my_next_payment_date: getMyNextPaymentDate,
} as const;

const Body = z.object({ tool: z.enum(Object.keys(TOOLS) as [keyof typeof TOOLS, ...(keyof typeof TOOLS)[]]) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to check your account." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });

  const answer = await TOOLS[parsed.data.tool](user.id);
  return NextResponse.json({ answer });
}
