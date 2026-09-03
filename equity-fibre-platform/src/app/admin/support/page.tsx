import { Card, SectionTitle, StatusPill, Pill, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { redactText } from "@/lib/domain/redaction";
import { TicketActions } from "./TicketActions";
import { KnowledgeEditor } from "./KnowledgeEditor";

export default async function SupportAdmin() {
  const [tickets, articles, unresolvedTrends] = await Promise.all([
    prisma.supportTicket.findMany({
      include: { conversation: { include: { messages: { orderBy: { createdAt: "asc" } } } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.knowledgeArticle.findMany({ orderBy: { title: "asc" } }),
    prisma.supportTicket.groupBy({ by: ["category"], _count: { category: true } }),
  ]);

  return (
    <div>
      <SectionTitle sub="Escalated tickets, a privacy-safe view of AI interactions, and the knowledge base.">Support</SectionTitle>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-ink">Escalated tickets</div>
            <div className="flex gap-1.5">
              {unresolvedTrends.map((t) => <Pill key={t.category} tone="slate">{t.category}: {t._count.category}</Pill>)}
            </div>
          </div>
          {tickets.length === 0 ? <EmptyState title="No tickets yet." /> : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <Card key={t.id}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-ink">{t.reference}</div>
                    <div className="flex items-center gap-1.5">
                      <Pill tone={t.priority === "urgent" ? "red" : t.priority === "high" ? "amber" : "slate"}>{t.priority}</Pill>
                      <StatusPill status={t.status} />
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-ink-faint">{t.category} · {t.reason}</div>
                  <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-2 text-xs">
                    {t.conversation.messages.slice(0, 4).map((m) => (
                      <div key={m.id}>
                        <span className="font-semibold text-ink-soft">{m.role}:</span>{" "}
                        {/* Customer text is redacted in this privacy-safe view. */}
                        <span className="text-ink-soft">{m.role === "customer" ? redactText(m.content) : m.content}</span>
                      </div>
                    ))}
                  </div>
                  {t.status !== "resolved" ? <div className="mt-2"><TicketActions ticketId={t.id} /></div> : null}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-ink">Knowledge base ({articles.length})</div>
          <KnowledgeEditor articles={articles.map((a) => ({ id: a.id, slug: a.slug, title: a.title, body: a.body, published: a.published, needsReview: a.needsReview }))} />
        </div>
      </div>
    </div>
  );
}
