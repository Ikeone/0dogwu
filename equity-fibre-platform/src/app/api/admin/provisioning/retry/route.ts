import { NextResponse } from "next/server";
import { z } from "zod";
import { withCapability } from "@/lib/auth/apiGuard";
import { retryJob, processDueJobs } from "@/lib/services/provisioning";
import { prisma } from "@/lib/db";

const Body = z.object({ jobId: z.string().min(1) });

export async function POST(req: Request) {
  return withCapability("provisioning.operate", async (user) => {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    await retryJob(parsed.data.jobId, user.email);
    // Immediately run the queue so staff see the outcome (demo affordance).
    await prisma.integrationJob.updateMany({ where: { status: "PENDING" }, data: { nextRunAt: new Date() } });
    const result = await processDueJobs(20);
    return NextResponse.json({ ok: true, result });
  });
}
