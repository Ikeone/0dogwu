import Link from "next/link";
import { Card, Stat, SectionTitle } from "@/components/ui";
import { getDashboardMetrics } from "@/lib/services/metrics";
import { formatNzd } from "@/lib/domain/pricing";

export default async function AdminDashboard() {
  const m = await getDashboardMetrics();
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div>
      <SectionTitle sub="Operational overview. Financial figures are estimates based on configurable costs.">Dashboard</SectionTitle>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Applications (7d)" value={m.applicationsThisWeek} />
        <Stat label="Eligibility success" value={pct(m.eligibilitySuccessRate)} hint="of decided applications" />
        <Stat label="Manual review" value={m.needsManualReview} hint="need a human" />
        <Stat label="Provisioning exceptions" value={m.provisioningExceptions} />
        <Stat label="Available modems" value={m.availableStock} />
        <Stat label="Awaiting assignment" value={m.awaitingAssignment} />
        <Stat label="Failed payments" value={m.failedPayments} />
        <Stat label="Active services" value={m.activeServices} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-sm font-semibold text-ink">Revenue & contribution (estimated)</div>
          <dl className="mt-3 space-y-2 text-sm">
            <Line k="Monthly recurring revenue" v={formatNzd(m.mrrCents)} />
            <Line k="Est. monthly contribution" v={formatNzd(m.estimatedMonthlyContributionCents)} />
            <Line k="Per-customer contribution" v={formatNzd(m.economics.estimatedContributionCents)} />
          </dl>
          <p className="mt-3 text-xs text-ink-faint">Estimates only. Unknown costs require confirmation.</p>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-ink">Automation health</div>
          <dl className="mt-3 space-y-2 text-sm">
            <Line k="Support conversations / active customer" v={m.supportConversationsPerActive.toFixed(2)} />
            <Line k="Escalations / 100 applications" v={m.escalationsPerHundredApplications.toFixed(1)} />
            <Line k="Integration job failures" v={String(m.integrationJobFailures)} />
          </dl>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-ink">Modem economics (per unit)</div>
          <dl className="mt-3 space-y-2 text-sm">
            <Line k="Modem + shipping" v={formatNzd(m.modem.purchaseCents + m.modem.shippingCents)} />
            <Line k="Chorus contribution" v={`−${formatNzd(m.modem.chorusContributionCents)}`} />
            <Line k="Customer contribution" v={formatNzd(m.modem.customerContributionCents)} />
            <Line k="Shortfall / surplus" v={formatNzd(m.modem.shortfallCents)} />
          </dl>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/applications" className="btn-secondary">Review applications</Link>
        <Link href="/admin/provisioning" className="btn-secondary">Provisioning queue</Link>
        <Link href="/admin/demo" className="btn-primary">Open demo controls</Link>
      </div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><dt className="text-ink-faint">{k}</dt><dd className="font-medium text-ink">{v}</dd></div>;
}
