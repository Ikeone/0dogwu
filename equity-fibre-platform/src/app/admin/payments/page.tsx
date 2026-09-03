import { Card, SectionTitle, StatusPill, Stat } from "@/components/ui";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hasCapability } from "@/lib/auth/rbac";
import { formatNzd } from "@/lib/domain/pricing";
import { RefundButton } from "./RefundButton";

export default async function PaymentsPage() {
  const user = await getSessionUser();
  const canRefund = user ? hasCapability(user.roles, "payments.refund") : false;

  const [txns, failedCount, refundedCount] = await Promise.all([
    prisma.paymentTransaction.findMany({ include: { serviceOrder: true }, orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.paymentTransaction.count({ where: { status: "failed" } }),
    prisma.paymentTransaction.count({ where: { status: "refunded" } }),
  ]);
  const succeeded = txns.filter((t) => t.status === "succeeded");
  const total = succeeded.reduce((s, t) => s + t.amountCents, 0);

  return (
    <div>
      <SectionTitle sub="Provider references only — no card data is ever stored. Fulfilment is webhook-driven and idempotent.">Payments</SectionTitle>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Collected (succeeded)" value={formatNzd(total)} />
        <Stat label="Failed" value={failedCount} />
        <Stat label="Refunded" value={refundedCount} />
      </div>

      <Card className="mt-5 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Order</th><th className="px-4 py-3">Kind</th><th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3">Provider ref</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {txns.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-ink">{t.serviceOrder.reference}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{t.kind.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5">{formatNzd(t.amountCents)}</td>
                  <td className="px-4 py-2.5"><StatusPill status={t.status} /></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-faint">{t.providerRef ? t.providerRef.slice(0, 14) + "…" : "—"}</td>
                  <td className="px-4 py-2.5 text-right">{canRefund && t.status === "succeeded" ? <RefundButton transactionId={t.id} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-xs text-ink-faint">Refunds and account changes require an authorised finance action and are fully audited.</p>
    </div>
  );
}
