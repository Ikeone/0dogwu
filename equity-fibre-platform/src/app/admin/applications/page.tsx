import Link from "next/link";
import { Card, SectionTitle, StatusPill, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";

const FILTERS = ["ALL", "SUBMITTED", "NEEDS_INFORMATION", "MANUAL_REVIEW", "ELIGIBLE", "INELIGIBLE"];

export default async function AdminApplications({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const active = status && FILTERS.includes(status) ? status : "ALL";
  const where = active === "ALL" ? {} : { status: active };
  const apps = await prisma.eligibilityApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { address: true, decisions: { orderBy: { createdAt: "desc" }, take: 1 } },
    take: 100,
  });

  return (
    <div>
      <SectionTitle sub="Search and triage applications. Only manual-review items need a human.">Applications</SectionTitle>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/applications${f === "ALL" ? "" : `?status=${f}`}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${active === f ? "bg-brand-600 text-white" : "bg-white text-ink-soft hover:bg-slate-50"}`}>
            {f.replace(/_/g, " ").toLowerCase()}
          </Link>
        ))}
      </div>

      {apps.length === 0 ? (
        <EmptyState title="No applications match this filter." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Decided</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {apps.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-ink">{a.reference}</td>
                    <td className="px-4 py-3 text-ink-soft">{a.address.line1}, {a.address.suburb}</td>
                    <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                    <td className="px-4 py-3 text-ink-faint">{a.decidedAt ? a.decidedAt.toLocaleDateString("en-NZ") : "—"}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/admin/applications/${a.id}`} className="text-brand-700 hover:underline">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
