import { Card, SectionTitle, Pill } from "@/components/ui";
import { prisma } from "@/lib/db";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const where = type ? { type: { contains: type } } : {};
  const events = await prisma.auditEvent.findMany({ where, orderBy: { createdAt: "desc" }, take: 120 });

  return (
    <div>
      <SectionTitle sub="Append-only history of significant events. Ordinary staff cannot edit or delete audit records.">
        Audit log
      </SectionTitle>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Time</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Target</th><th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {events.map((e) => (
                <tr key={e.id} className="align-top hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-ink-faint">{e.createdAt.toLocaleString("en-NZ")}</td>
                  <td className="px-4 py-2"><Pill tone="slate">{e.type}</Pill></td>
                  <td className="px-4 py-2 text-ink-soft">{e.actorLabel}</td>
                  <td className="px-4 py-2 text-xs text-ink-faint">{e.targetType ? `${e.targetType}:${e.targetId?.slice(0, 8) ?? ""}` : "—"}</td>
                  <td className="px-4 py-2 text-ink-soft">{e.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-xs text-ink-faint">Showing latest {events.length} events. Metadata is redacted of PII and secrets before storage.</p>
    </div>
  );
}
