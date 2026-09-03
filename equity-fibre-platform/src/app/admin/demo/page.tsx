import { Card, SectionTitle, StatusPill } from "@/components/ui";
import { prisma } from "@/lib/db";
import { DemoControls } from "./DemoControls";

export default async function AdminDemoPage() {
  const orders = await prisma.serviceOrder.findMany({
    include: {
      application: true,
      subscription: true,
      shipment: true,
      provisioning: true,
      assignment: { include: { device: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <SectionTitle sub="Simulate external provider events (Chorus, payments, courier). Each button drives the same code a real webhook would. Demo mode only.">
        Demo controls
      </SectionTitle>

      {orders.length === 0 ? (
        <Card><p className="text-sm text-ink-faint">No service orders yet. Submit an eligible application first.</p></Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((o) => (
            <Card key={o.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{o.reference}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Scenario {o.application.scenarioTag ?? "—"}</span>
                  </div>
                  <div className="mt-1 text-xs text-ink-faint">{o.application.contactName} · {o.application.reference}</div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <StatusPill status={o.status} />
                  {o.subscription ? <StatusPill status={`sub:${o.subscription.status}`} /> : null}
                  {o.shipment ? <StatusPill status={`ship:${o.shipment.status}`} /> : null}
                  {o.assignment ? <StatusPill status={`dev:${o.assignment.device.status}`} /> : null}
                </div>
              </div>
              <DemoControls orderId={o.id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
