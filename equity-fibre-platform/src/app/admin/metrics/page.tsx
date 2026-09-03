import { Card, SectionTitle, Stat } from "@/components/ui";
import { getDashboardMetrics } from "@/lib/services/metrics";
import { getBusinessConfig } from "@/lib/services/config";
import { formatNzd, unitEconomics } from "@/lib/domain/pricing";

export default async function MetricsPage() {
  const m = await getDashboardMetrics();
  const cfg = await getBusinessConfig();
  const eco = unitEconomics(cfg);

  return (
    <div>
      <SectionTitle sub="Internal unit economics. Estimates only — not an accounting system. Never shown to customers.">
        Metrics & unit economics
      </SectionTitle>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Active customers" value={m.activeServices} />
        <Stat label="MRR" value={formatNzd(m.mrrCents)} />
        <Stat label="Est. monthly contribution" value={formatNzd(m.estimatedMonthlyContributionCents)} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold text-ink">Per-customer monthly (estimated)</div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Retail revenue" v={formatNzd(eco.retailCents)} />
            <Row k="Wholesale access (incl GST)" v={`−${formatNzd(eco.wholesaleInclGstCents)}`} />
            <Row k="Payment processing (est.)" v={`−${formatNzd(eco.paymentFeeCents)}`} />
            <Row k="Estimated contribution" v={formatNzd(eco.estimatedContributionCents)} bold />
          </dl>
          <p className="mt-3 text-xs text-ink-faint">Excludes platform, support and bad-debt costs, which require confirmation (see open questions Q21).</p>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-ink">Modem (per unit)</div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Modem cost" v={formatNzd(m.modem.purchaseCents)} />
            <Row k="Shipping" v={formatNzd(m.modem.shippingCents)} />
            <Row k="Chorus contribution" v={`−${formatNzd(m.modem.chorusContributionCents)}`} />
            <Row k="Customer contribution" v={formatNzd(m.modem.customerContributionCents)} />
            <Row k="Shortfall / surplus" v={formatNzd(m.modem.shortfallCents)} bold />
          </dl>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-ink">Automation & load</div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Manual reviews outstanding" v={String(m.needsManualReview)} />
            <Row k="Escalations / 100 applications" v={m.escalationsPerHundredApplications.toFixed(1)} />
            <Row k="Support conversations / active customer" v={m.supportConversationsPerActive.toFixed(2)} />
            <Row k="Integration job failures" v={String(m.integrationJobFailures)} />
          </dl>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-ink">Scale assumptions</div>
          <p className="mt-2 text-sm text-ink-soft">Up to ~10,000 potential households. Low transaction volume relative to typical consumer SaaS. The architecture (modular monolith + worker + one Postgres) comfortably handles this range; see docs/DEPLOYMENT.md.</p>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "border-t border-slate-100 pt-2 font-semibold text-ink" : ""}`}><dt className={bold ? "" : "text-ink-faint"}>{k}</dt><dd className={bold ? "" : "font-medium text-ink"}>{v}</dd></div>;
}
