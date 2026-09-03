import { Card, SectionTitle, StatusPill, Stat } from "@/components/ui";
import { prisma } from "@/lib/db";
import { InventoryTools } from "./InventoryTools";

export default async function InventoryPage() {
  const devices = await prisma.modemDevice.findMany({
    include: { model: true, assignment: { include: { serviceOrder: true } } },
    orderBy: { receivedAt: "desc" },
    take: 200,
  });
  const counts = devices.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <SectionTitle sub="Import stock, assign once, and trace each device for life. MAC addresses are normalised, validated and unique.">
        Modem inventory
      </SectionTitle>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total" value={devices.length} />
        <Stat label="Available" value={counts.AVAILABLE ?? 0} />
        <Stat label="Reserved" value={counts.RESERVED ?? 0} />
        <Stat label="Active" value={counts.ACTIVE ?? 0} />
      </div>

      <div className="mt-5">
        <InventoryTools />
      </div>

      <Card className="mt-5 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">WAN MAC</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-ink">{d.assetId}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{d.model.manufacturer} {d.model.model}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{d.serialNumber}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{d.wanMac}</td>
                  <td className="px-4 py-2.5"><StatusPill status={d.status} /></td>
                  <td className="px-4 py-2.5 text-ink-faint">{d.assignment?.serviceOrder.reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
