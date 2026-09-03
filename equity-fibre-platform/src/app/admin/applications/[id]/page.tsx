import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Pill, StatusPill } from "@/components/ui";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hasCapability } from "@/lib/auth/rbac";
import { ReviewActions } from "./ReviewActions";
import { EvidenceViewer } from "./EvidenceViewer";

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const app = await prisma.eligibilityApplication.findUnique({
    where: { id },
    include: {
      address: true,
      ruleResults: { orderBy: { createdAt: "asc" } },
      decisions: { orderBy: { createdAt: "desc" } },
      evidence: true,
      consents: true,
      serviceOrder: true,
    },
  });
  if (!app) notFound();

  const canDecide = user ? hasCapability(user.roles, "applications.decide") : false;
  const canSeeEvidence = user ? hasCapability(user.roles, "evidence.access") : false;

  return (
    <div>
      <Link href="/admin/applications" className="text-sm text-ink-faint hover:text-ink">← Applications</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">{app.reference}</h1>
        <StatusPill status={app.status} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="text-sm font-semibold text-ink">Eligibility assessment</div>
            <ul className="mt-3 space-y-2">
              {app.ruleResults.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-sm">
                  <Pill tone={r.outcome === "pass" ? "green" : r.outcome === "fail" ? "red" : "amber"}>{r.outcome}</Pill>
                  <div>
                    <div className="font-medium text-ink">{r.ruleCode}</div>
                    <div className="text-ink-soft">{r.reason}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-ink-faint">Rule version {app.ruleResults[0]?.ruleVersion ?? "—"}. Decisions are deterministic — the AI never decides eligibility.</div>
          </Card>

          <Card>
            <div className="text-sm font-semibold text-ink">Evidence</div>
            {app.evidence.length === 0 ? (
              <p className="mt-2 text-sm text-ink-faint">No evidence uploaded.</p>
            ) : canSeeEvidence ? (
              <div className="mt-3 space-y-2">
                {app.evidence.map((e) => <EvidenceViewer key={e.id} evidenceId={e.id} name={e.safeName} mime={e.detectedMime} state={e.reviewState} />)}
              </div>
            ) : (
              <p className="mt-2 text-sm text-amber-700">You don’t have permission to view evidence. (Requires evidence.access)</p>
            )}
          </Card>

          {canDecide && (app.status === "MANUAL_REVIEW" || app.status === "NEEDS_INFORMATION") ? (
            <Card>
              <div className="text-sm font-semibold text-ink">Manual decision</div>
              <ReviewActions applicationId={app.id} />
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <div className="text-sm font-semibold text-ink">Address & contact</div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div><dt className="text-ink-faint">Address</dt><dd className="text-ink">{app.address.line1}, {app.address.suburb}, {app.address.city}</dd></div>
              <div><dt className="text-ink-faint">ONT</dt><dd className="text-ink">{app.address.hasOnt ? "Present" : "None"}</dd></div>
              <div><dt className="text-ink-faint">Household</dt><dd className="text-ink">{app.housingCategory ?? "—"}</dd></div>
              <div><dt className="text-ink-faint">Contact</dt><dd className="text-ink">{app.contactName}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-ink-faint">Payment details are intentionally not shown here.</p>
          </Card>
          <Card>
            <div className="text-sm font-semibold text-ink">Consent</div>
            <ul className="mt-2 space-y-1 text-sm">
              {app.consents.map((c) => (
                <li key={c.id} className="flex justify-between"><span className="text-ink-faint">{c.consentType}</span><Pill tone={c.granted ? "green" : "slate"}>{c.granted ? "granted" : "no"}</Pill></li>
              ))}
            </ul>
          </Card>
          {app.serviceOrder ? (
            <Card>
              <div className="text-sm font-semibold text-ink">Service order</div>
              <div className="mt-2 flex items-center justify-between text-sm"><span className="text-ink-faint">{app.serviceOrder.reference}</span><StatusPill status={app.serviceOrder.status} /></div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
