import { Card, SectionTitle, StatusPill, Pill, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { RetryButton } from "./RetryButton";

export default async function ProvisioningPage() {
  const [orders, jobs] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: { status: { in: ["READY_FOR_PROVISIONING", "PROVISIONING_REQUESTED", "PROVISIONING_IN_PROGRESS", "PROVISIONING_BLOCKED", "READY_FOR_ACTIVATION"] } },
      include: { application: true, provisioning: { include: { events: { orderBy: { createdAt: "asc" } } } }, externalRefs: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.integrationJob.findMany({ include: { attemptLog: { orderBy: { attemptNo: "asc" } } }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <div>
      <SectionTitle sub="Durable integration jobs with retries, correlation and idempotency keys. Only genuine exceptions need action.">
        Provisioning operations
      </SectionTitle>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-semibold text-ink">Pending orders</div>
          {orders.length === 0 ? <EmptyState title="Nothing awaiting provisioning." /> : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Card key={o.id}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-ink">{o.reference}</div>
                    <StatusPill status={o.status} />
                  </div>
                  <div className="mt-1 text-xs text-ink-faint">Correlation: {o.provisioning?.correlationId ?? "—"}</div>
                  {o.externalRefs.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.externalRefs.map((r) => <Pill key={r.id} tone="slate">{r.refType}: {r.refType.includes("mac") || r.refType.includes("serial") ? "•••" : r.value}</Pill>)}
                    </div>
                  ) : null}
                  {o.provisioning?.events.length ? (
                    <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                      {o.provisioning.events.map((e) => <li key={e.id}>• {e.detail}</li>)}
                    </ul>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-ink">Integration jobs</div>
          <div className="space-y-3">
            {jobs.map((j) => (
              <Card key={j.id}>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-ink-soft">{j.type}</div>
                  <StatusPill status={j.status} />
                </div>
                <div className="mt-1 text-xs text-ink-faint">Attempts {j.attempts}/{j.maxAttempts} · {j.attemptLog.map((a) => a.outcome).join(" → ") || "—"}</div>
                {j.lastError ? <div className="mt-1 text-xs text-rose-600">{j.lastError}</div> : null}
                {(j.status === "DEAD_LETTER" || j.status === "FAILED") ? <div className="mt-2"><RetryButton jobId={j.id} /></div> : null}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
