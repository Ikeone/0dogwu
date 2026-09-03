/**
 * Deterministic knowledge-base search. No external services. Ranking is a
 * transparent bag-of-words overlap score with title/tag boosts, so the same
 * question always returns the same ordering (testable).
 */
import type { KnowledgeHit } from "@/lib/providers/types";

export interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
  published: boolean;
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "to", "of", "and", "or", "my", "i", "in",
  "on", "it", "for", "how", "do", "does", "with", "can", "what", "why", "me",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function scoreArticle(queryTokens: string[], article: Article): number {
  const titleTokens = new Set(tokenize(article.title));
  const bodyTokens = new Set(tokenize(article.body));
  const tagTokens = new Set(article.tags.flatMap((t) => tokenize(t)));
  let score = 0;
  for (const qt of queryTokens) {
    if (titleTokens.has(qt)) score += 3;
    if (tagTokens.has(qt)) score += 2;
    if (bodyTokens.has(qt)) score += 1;
  }
  return score;
}

export function searchKnowledge(
  question: string,
  articles: Article[],
  limit = 3,
): KnowledgeHit[] {
  const qTokens = tokenize(question);
  if (qTokens.length === 0) return [];
  return articles
    .filter((a) => a.published)
    .map((a) => ({ a, score: scoreArticle(qTokens, a) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || x.a.title.localeCompare(y.a.title))
    .slice(0, limit)
    .map(({ a, score }) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      score,
      excerpt: a.body.slice(0, 240),
    }));
}
