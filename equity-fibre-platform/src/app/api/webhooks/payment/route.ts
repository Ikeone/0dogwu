import { NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/lib/services/payments";
import { logger } from "@/lib/logger";

// Payment provider webhook endpoint.
// IMPORTANT: uses the RAW request body for signature verification. Node's
// default body parsing is bypassed by reading req.text() directly. Real
// providers (e.g. Stripe) require the exact bytes they signed.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  // Body-size guard.
  if (raw.length > 64 * 1024) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }
  const signature =
    req.headers.get("x-mock-signature") ?? req.headers.get("stripe-signature");
  try {
    const result = await handlePaymentWebhook(raw, signature);
    return NextResponse.json(result);
  } catch (err) {
    logger.warn("webhook.payment_rejected", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Rejected." }, { status: 400 });
  }
}
