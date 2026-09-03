import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withCapability } from "@/lib/auth/apiGuard";
import { recordAudit } from "@/lib/services/audit";

const Body = z.object({
  id: z.string().optional(),
  slug: z.string().min(2).max(80),
  title: z.string().min(2).max(200),
  body: z.string().min(2).max(4000),
  published: z.boolean(),
  needsReview: z.boolean().optional(),
});

export async function POST(req: Request) {
  return withCapability("knowledge.edit", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const d = parsed.data;
    const saved = await prisma.knowledgeArticle.upsert({
      where: { slug: d.slug },
      update: { title: d.title, body: d.body, published: d.published, needsReview: d.needsReview ?? false },
      create: { slug: d.slug, title: d.title, body: d.body, tagsJson: "[]", published: d.published, needsReview: d.needsReview ?? false },
    });
    await recordAudit({
      type: "knowledge.published",
      actorId: user.id,
      actorLabel: user.email,
      targetType: "article",
      targetId: saved.id,
      metadata: { slug: d.slug, published: d.published },
    });
    return NextResponse.json({ ok: true });
  });
}
