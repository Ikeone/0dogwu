import { Card, SectionTitle, StatusPill, Pill, EmptyState, Stat } from "@/components/ui";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hasCapability } from "@/lib/auth/rbac";
import { HardshipActions, HoldActions, SuspensionPreview } from "./HardshipActions";

export default async function HardshipAdmin() {
  const user = await getSessionUser();
  const canManageHolds = user ? hasCapability(user.roles, "holds.manage") : false;

  const [hardship, disputes, holds, decisions, activeServices] = await Promise.all([
    prisma.hardshipCase.findMany({ where: { status: { in: ["open", "in_progress"] } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.billingDispute.findMany({ where: { status: { in: ["open", "investigating"] } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.accountHold.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.suspensionDecision.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.serviceOrder.findMany({ where: { status: "ACTIVE" }, include: { application: true }, take: 20 }),
  ]);

  return (
    <div>
      <SectionTitle sub="Protect low-income customers: an active hold blocks automatic suspension. Every action is audited.">
        Hardship, disputes & holds
      </SectionTitle>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Open hardship" value={hardship.length} />
        <Stat label="Open disputes" value={disputes.length} />
        <Stat label="Active holds" value={holds.length} />
        <Stat label="Active services" value={activeServices.length} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-semibold text-ink">Hardship queue</div>
          {hardship.length === 0 ? <EmptyState title="No open hardship cases." /> : (
            <div className="space-y-3">
              {hardship.map((c) => (
                <Card key={c.id}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{c.reference}</span>
                    <StatusPill status={c.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{c.reason}</p>
                  <div className="mt-2"><HardshipActions kind="hardship" id={c.id} /></div>
                </Card>
              ))}
            </div>
          )}

          <div className="mb-2 mt-6 text-sm font-semibold text-ink">Dispute queue</div>
          {disputes.length === 0 ? <EmptyState title="No open disputes." /> : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <Card key={d.id}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{d.reference}</span>
                    <StatusPill status={d.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{d.reason}</p>
                  <div className="mt-2"><HardshipActions kind="dispute" id={d.id} /></div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-ink">Active holds</div>
          {holds.length === 0 ? <EmptyState title="No active holds." /> : (
            <div className="space-y-2">
              {holds.map((h) => (
                <Card key={h.id}>
                  <div className="flex items-center justify-between">
                    <Pill tone="amber">{h.holdType.replace(/_/g, " ")}</Pill>
                    <span className="text-xs text-ink-faint">{h.expiresAt ? `expires ${h.expiresAt.toLocaleDateString("en-NZ")}` : "no expiry"}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{h.reason}</p>
                  {canManageHolds ? <div className="mt-2"><HoldActions holdId={h.id} /></div> : null}
                </Card>
              ))}
            </div>
          )}

          <div className="mb-2 mt-6 text-sm font-semibold text-ink">Suspension preview (active services)</div>
          <Card>
            <p className="text-xs text-ink-faint">Preview whether an active service would be suspended right now. Holds/disputes block it.</p>
            <div className="mt-2 space-y-2">
              {activeServices.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-2">
                  <span className="text-sm text-ink">{o.reference}</span>
                  <SuspensionPreview serviceOrderId={o.id} />
                </div>
              ))}
              {activeServices.length === 0 ? <p className="text-sm text-ink-faint">No active services.</p> : null}
            </div>
          </Card>

          <div className="mb-2 mt-6 text-sm font-semibold text-ink">Recent suspension decisions</div>
          <Card className="p-0">
            <ul className="divide-y divide-slate-50 text-sm">
              {decisions.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-4 py-2">
                  <span className="text-ink-soft">{d.reason}</span>
                  <StatusPill status={d.outcome} />
                </li>
              ))}
              {decisions.length === 0 ? <li className="px-4 py-3 text-ink-faint">No decisions yet.</li> : null}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
