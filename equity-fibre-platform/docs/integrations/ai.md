# AI support integration

> **Status: Knowledge-base mode fully working with no external key. Anthropic mode is a guarded scaffold.**

## Modes
- `AI_PROVIDER=knowledge_base` (default): deterministic search over **approved, published** knowledge articles (`src/lib/ai/search.ts`), returns the best answer with citations, states uncertainty, and offers a ticket. Never invents product-specific instructions. (`src/lib/providers/mock/ai.ts`)
- `AI_PROVIDER=anthropic`: activates only when `ANTHROPIC_API_KEY` **and** `ANTHROPIC_MODEL` are present. Grounds answers in retrieved approved knowledge; keeps the system prompt server-side; low temperature; model id read from env (never hard-coded as "latest"). It is a scaffold that fails clearly until wired to the official SDK (`src/lib/providers/anthropic/ai.ts`).

## To enable Anthropic
1. `npm i @anthropic-ai/sdk`.
2. Set `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (server-side only).
3. Complete the `callModel()` body in `AnthropicSupportProvider` (the SDK call is written out in comments).

## Safety & guardrails (enforced regardless of mode)
- The AI **never** decides eligibility (deterministic engine only) and never promises activation dates.
- Immediate escalation for safety/electrical, privacy complaints, payment disputes, abuse, vulnerable-customer, account-ownership (`src/lib/ai/escalation.ts`).
- Prompt-injection attempts are detected and ignored, never executed.
- Account-aware tools (`get_my_*`) derive identity from the authenticated session — the model never supplies a customer id; tools are read-only and ownership-checked (`src/lib/services/support.ts`, `src/app/api/support/tool/route.ts`).
- Context sent to a model excludes eligibility documents and payment data; PII is redacted where not needed. Per-customer and per-IP rate limits apply.

## Knowledge content
Seeded in `src/lib/knowledge/articles.ts`. Because the exact modem model is unknown (Q33), model-specific articles are generic and flagged `needsReview`; the app never fabricates specific light colours/button positions/port names.
