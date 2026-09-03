import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/db";
import { createModemCheckout } from "@/lib/services/payments";
import { getBusinessConfig } from "@/lib/services/config";
import { modemContribution, monthlyPrice, formatNzd } from "@/lib/domain/pricing";
import { CheckoutButtons } from "./CheckoutButtons";

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { application: true },
  });
  if (!order) notFound();

  const cfg = await getBusinessConfig();
  const modem = modemContribution(cfg);
  const price = monthlyPrice(cfg);
  // Create/refresh the pending checkout (idempotent) so the amount is authoritative.
  const checkout = await createModemCheckout(order.id);
  const alreadyPaid = order.status !== "AWAITING_MODEM_PAYMENT";

  return (
    <div className="min-h-screen">
      <div className="container-page py-8">
        <Wordmark />
        <div className="mx-auto mt-8 max-w-lg">
          <Card>
            <h1 className="text-xl font-semibold text-ink">Upfront modem contribution</h1>
            <p className="mt-1 text-sm text-ink-faint">Order {order.reference}. This is a one-off payment, collected before your modem ships.</p>

            <div className="mt-5 rounded-xl border border-slate-200 p-4 text-sm">
              <div className="flex justify-between py-1"><span className="text-ink-faint">Modem</span><span>{formatNzd(modem.purchaseCents)}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink-faint">Shipping</span><span>{formatNzd(modem.shippingCents)}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink-faint">Chorus contribution</span><span>−{formatNzd(modem.chorusContributionCents)}</span></div>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-semibold"><span>You pay today</span><span>{formatNzd(checkout.amountCents)}</span></div>
            </div>

            <p className="mt-3 text-xs text-ink-faint">
              After this, your monthly plan is {formatNzd(price.consumerPriceCents)}/month — but monthly billing only starts once your fibre is activated.
            </p>

            <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              Simulated hosted checkout. No real card details are collected. Choose an outcome to demonstrate the flow.
            </div>

            {alreadyPaid ? (
              <div className="mt-5">
                <p className="text-sm text-emerald-700">This order’s upfront payment is already recorded ({order.status.replace(/_/g, " ").toLowerCase()}).</p>
                <Link href="/portal" className="btn-primary mt-3 w-full">Go to my portal</Link>
              </div>
            ) : (
              <CheckoutButtons orderId={order.id} />
            )}
          </Card>
          <p className="mt-4 text-center text-sm"><Link href="/portal" className="text-ink-faint hover:text-ink">View my portal</Link></p>
        </div>
      </div>
    </div>
  );
}
