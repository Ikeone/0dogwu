/**
 * Support service: AI-assisted answers grounded in approved knowledge, safe
 * account-aware status tools, and human escalation.
 *
 * Security posture:
 * - The AI only ranks/returns APPROVED knowledge; it never decides eligibility
 *   or changes service state.
 * - Account tools derive identity from the authenticated session userId passed
 *   by the caller — the model never supplies an arbitrary customer id.
 * - Prompt-injection attempts are detected and ignored, never executed.
 */
import { prisma } from "@/lib/db";
import { getSupportAIProvider } from "@/lib/providers/factory";
import { searchKnowledge, type Article } from "@/lib/ai/search";
import {
  checkImmediateEscalation,
  looksLikePromptInjection,
} from "@/lib/ai/escalation";
import { getBusinessConfig } from "./config";
import { recordAudit } from "./audit";
import { humanRef } from "@/lib/ids";
import { formatNzd } from "@/lib/domain/pricing";

export interface AskResult {
  answer: string;
  citations: { id: string; title: string }[];
  escalated: boolean;
  escalationReason?: string;
  ticketReference?: string;
  injectionIgnored: boolean;
}

async function loadArticles(): Promise<Article[]> {
  const rows = await prisma.knowledgeArticle.findMany({ where: { published: true } });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    body: r.body,
    tags: JSON.parse(r.tagsJson) as string[],
    published: r.published,
  }));
}

export async function askSupport(
  question: string,
  userId: string | null,
): Promise<AskResult> {
  const cfg = await getBusinessConfig();
  const injection = looksLikePromptInjection(question);

  // Get or create a conversation for this user (or anonymous).
  const conversation = await prisma.supportConversation.create({
    data: { userId: userId ?? undefined },
  });
  await prisma.supportMessage.create({
    data: { conversationId: conversation.id, role: "customer", content: question.slice(0, 2000) },
  });

  // Immediate escalation categories bypass the AI entirely.
  const immediate = checkImmediateEscalation(question);
  if (immediate.escalate) {
    const ticket = await escalate(
      conversation.id,
      immediate.category ?? "general",
      immediate.reason ?? "Escalation triggered",
      immediate.priority ?? "high",
    );
    const answer =
      "This looks like something a person should help with directly. I've created a support ticket and a human will follow up.";
    await prisma.supportMessage.create({
      data: { conversationId: conversation.id, role: "assistant", content: answer },
    });
    return {
      answer,
      citations: [],
      escalated: true,
      escalationReason: immediate.reason,
      ticketReference: ticket.reference,
      injectionIgnored: injection,
    };
  }

  // Retrieve approved knowledge and let the provider compose a grounded answer.
  const articles = await loadArticles();
  const hits = searchKnowledge(question, articles, 3);
  const ai = await getSupportAIProvider().answer(question, hits);

  let ticketReference: string | undefined;
  let escalated = false;
  if (ai.shouldEscalate) {
    const ticket = await escalate(conversation.id, "unresolved", "Assistant could not resolve the question", "normal");
    ticketReference = ticket.reference;
    escalated = true;
  }

  await prisma.supportMessage.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: ai.answer,
      citationsJson: JSON.stringify(ai.citations),
    },
  });

  await recordAudit({
    type: "support.ai_answer",
    actorId: userId,
    actorLabel: userId ? "customer" : "anonymous",
    targetType: "conversation",
    targetId: conversation.id,
    metadata: {
      confident: ai.confident,
      citations: ai.citations.map((c) => c.title),
      escalated,
      injectionIgnored: injection,
      escalateThreshold: cfg.support.escalateAfterUnresolvedAnswers,
    },
  });

  return {
    answer: ai.answer,
    citations: ai.citations,
    escalated,
    ticketReference,
    injectionIgnored: injection,
  };
}

export async function escalate(
  conversationId: string,
  category: string,
  reason: string,
  priority: "normal" | "high" | "urgent",
) {
  const existing = await prisma.supportTicket.findUnique({ where: { conversationId } });
  if (existing) return existing;
  const ticket = await prisma.supportTicket.create({
    data: {
      conversationId,
      reference: humanRef("TKT"),
      category,
      priority,
      status: "open",
      reason,
    },
  });
  await recordAudit({
    type: "support.escalated",
    actorLabel: "system",
    targetType: "ticket",
    targetId: ticket.id,
    reason,
    metadata: { category, priority },
  });
  return ticket;
}

// --- Account-aware status tools (read-only, ownership-enforced) --------------

async function ownedOrder(userId: string) {
  return prisma.serviceOrder.findFirst({
    where: { application: { userId } },
    include: {
      application: true,
      assignment: { include: { device: true } },
      shipment: true,
      subscription: true,
      provisioning: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyApplicationStatus(userId: string): Promise<string> {
  const app = await prisma.eligibilityApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!app) return "I can't find an application on your account.";
  return `Your application ${app.reference} is currently: ${app.status.replace(/_/g, " ").toLowerCase()}.`;
}

export async function getMyOrderStatus(userId: string): Promise<string> {
  const order = await ownedOrder(userId);
  if (!order) return "I can't find a service order on your account yet.";
  return `Order ${order.reference} status: ${order.status.replace(/_/g, " ").toLowerCase()}.`;
}

export async function getMyShipmentStatus(userId: string): Promise<string> {
  const order = await ownedOrder(userId);
  if (!order?.shipment) return "No shipment has been created yet.";
  return `Your modem shipment (${order.shipment.trackingRef}) is: ${order.shipment.status.toLowerCase()}.`;
}

export async function getMyServiceStatus(userId: string): Promise<string> {
  const order = await ownedOrder(userId);
  if (!order) return "No active service found.";
  const sub = order.subscription?.status ?? "NOT_CREATED";
  return `Service: ${order.status.replace(/_/g, " ").toLowerCase()}; billing: ${sub.replace(/_/g, " ").toLowerCase()}.`;
}

export async function getMyNextPaymentDate(userId: string): Promise<string> {
  const order = await ownedOrder(userId);
  const sub = order?.subscription;
  if (!sub || !sub.nextBillingAt) return "No monthly billing date is scheduled yet.";
  return `Your next monthly payment of ${formatNzd(sub.monthlyPriceCents)} is due on ${sub.nextBillingAt.toLocaleDateString("en-NZ")}.`;
}

/** Customer-confirmed ticket creation (state-changing tool). */
export async function createSupportTicket(userId: string | null, summary: string) {
  const conversation = await prisma.supportConversation.create({ data: { userId: userId ?? undefined } });
  await prisma.supportMessage.create({
    data: { conversationId: conversation.id, role: "customer", content: summary.slice(0, 2000) },
  });
  return escalate(conversation.id, "customer_request", summary.slice(0, 200), "normal");
}
