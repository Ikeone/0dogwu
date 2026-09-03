import type {
  KnowledgeHit,
  SupportAIProvider,
  SupportAnswer,
} from "@/lib/providers/types";
import { getBusinessConfig } from "@/lib/services/config";

/**
 * Knowledge-base-only support provider. Works with NO external API key.
 *
 * - Returns the most relevant approved article's content.
 * - States clearly when it cannot answer and offers a ticket.
 * - NEVER invents product-specific instructions (only returns approved text).
 * - NEVER decides eligibility or promises activation dates.
 */
export class KnowledgeBaseAIProvider implements SupportAIProvider {
  readonly name = "knowledge_base";

  async answer(question: string, hits: KnowledgeHit[]): Promise<SupportAnswer> {
    const cfg = await getBusinessConfig();
    const top = hits[0];
    const strong = top && top.score >= 3;

    if (!top) {
      return {
        answer:
          "I couldn't find an approved answer for that yet. I can create a support ticket so a person can help you.",
        confident: false,
        citations: [],
        shouldEscalate: false,
      };
    }

    if (!strong) {
      return {
        answer:
          `I'm not fully sure about that. The closest guidance I have is "${top.title}". ` +
          `If that doesn't help, I can escalate to a person.`,
        confident: false,
        citations: [{ id: top.id, title: top.title }],
        shouldEscalate: hits.length < cfg.support.escalateAfterUnresolvedAnswers ? false : true,
      };
    }

    return {
      answer: `${top.excerpt}${top.excerpt.length >= 240 ? "…" : ""}`,
      confident: true,
      citations: hits.slice(0, 2).map((h) => ({ id: h.id, title: h.title })),
      shouldEscalate: false,
    };
  }
}
