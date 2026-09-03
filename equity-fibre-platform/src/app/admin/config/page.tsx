import { Card, SectionTitle } from "@/components/ui";
import { getBusinessConfig } from "@/lib/services/config";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hasCapability } from "@/lib/auth/rbac";
import { ConfigEditor } from "./ConfigEditor";

export default async function ConfigPage() {
  const cfg = await getBusinessConfig();
  const user = await getSessionUser();
  const canEdit = user ? hasCapability(user.roles, "config.edit") : false;
  const changes = await prisma.configurationChange.findMany({ orderBy: { createdAt: "desc" }, take: 10 });

  return (
    <div>
      <SectionTitle sub="Business rules without code changes. Secrets are never shown or editable here. Every change is audited.">
        Configuration
      </SectionTitle>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold text-ink">Current business rules</div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row k="Inactivity period (days)" v={String(cfg.eligibility.inactivityDays)} />
            <Row k="Housing categories" v={cfg.eligibility.enabledHousingCategories.join(", ")} />
            <Row k="Evidence types" v={cfg.eligibility.enabledEvidenceTypes.join(", ")} />
            <Row k="Modem payment trigger" v={cfg.billing.modemPaymentTrigger} />
            <Row k="Monthly billing trigger" v={cfg.billing.monthlyBillingTrigger} />
            <Row k="Grace period (days)" v={String(cfg.billing.gracePeriodDays)} />
            <Row k="Suspend on single failure" v={String(cfg.billing.suspendOnSingleFailure)} />
            <Row k="Deduct Chorus contribution" v={String(cfg.modem.deductChorusContribution)} />
            <Row k="Rule version" v={cfg.eligibility.ruleVersion} />
          </dl>
        </Card>

        {canEdit ? (
          <ConfigEditor cfg={{
            monthlyBillingTrigger: cfg.billing.monthlyBillingTrigger,
            modemPaymentTrigger: cfg.billing.modemPaymentTrigger,
            gracePeriodDays: cfg.billing.gracePeriodDays,
            suspendOnSingleFailure: cfg.billing.suspendOnSingleFailure,
            deductChorusContribution: cfg.modem.deductChorusContribution,
            inactivityDays: cfg.eligibility.inactivityDays,
          }} />
        ) : (
          <Card><p className="text-sm text-amber-700">You can view configuration but only a Super Admin can change it.</p></Card>
        )}
      </div>

      <Card className="mt-5">
        <div className="text-sm font-semibold text-ink">Recent configuration changes</div>
        {changes.length === 0 ? <p className="mt-2 text-sm text-ink-faint">No changes yet.</p> : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {changes.map((c) => (
              <li key={c.id} className="flex justify-between gap-4 border-b border-slate-50 py-1.5">
                <span className="text-ink-soft">{c.oldValue} → <strong className="text-ink">{c.newValue}</strong></span>
                <span className="text-xs text-ink-faint">{c.changedBy} · {c.createdAt.toLocaleString("en-NZ")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-ink-faint">{k}</dt><dd className="text-right font-medium text-ink">{v}</dd></div>;
}
