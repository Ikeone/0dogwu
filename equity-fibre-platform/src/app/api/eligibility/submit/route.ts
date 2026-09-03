import { NextResponse } from "next/server";
import { z } from "zod";
import { submitApplication } from "@/lib/services/applications";
import { storeEvidence, EvidenceRejectedError } from "@/lib/services/evidence";
import { getSessionUser } from "@/lib/auth/session";
import { clientIp } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

const Fields = z.object({
  placeRef: z.string().min(3),
  addressLine: z.string().min(1),
  suburb: z.string().min(1),
  city: z.string().min(1),
  postcode: z.string().min(1),
  housingCategory: z.enum(["public_housing", "community_housing", "school_equity", "none"]),
  evidenceType: z.enum(["community_services_card", "msd_benefit_letter", "none"]),
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(40).optional(),
  serviceConsent: z.string(),
  marketingConsent: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`submit:${ip ?? "x"}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many submissions. Please wait." }, { status: 429 });
  }

  const form = await req.formData();
  const values = Object.fromEntries(
    Array.from(form.entries()).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  const parsed = Fields.safeParse(values);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const f = parsed.data;
  if (f.serviceConsent !== "true") {
    return NextResponse.json({ error: "Service consent is required." }, { status: 400 });
  }

  const file = form.get("evidence");
  const hasFile = file instanceof File && file.size > 0;

  const user = await getSessionUser();
  try {
    const result = await submitApplication({
      userId: user?.id ?? null,
      placeRef: f.placeRef,
      addressLine: f.addressLine,
      suburb: f.suburb,
      city: f.city,
      postcode: f.postcode,
      housingCategory: f.housingCategory,
      evidenceType: f.evidenceType,
      evidenceProvided: hasFile,
      contactName: f.contactName,
      contactEmail: f.contactEmail,
      contactPhone: f.contactPhone,
      serviceConsent: true,
      marketingConsent: f.marketingConsent === "true",
      policyVersion: "v1.0-demo",
      ip,
    });

    if (hasFile) {
      const bytes = Buffer.from(await (file as File).arrayBuffer());
      await storeEvidence(result.applicationId, f.evidenceType, (file as File).name, bytes);
    }

    return NextResponse.json({
      ok: true,
      reference: result.reference,
      outcome: result.decision.outcome,
      reason: result.decision.reason,
      results: result.decision.results,
      serviceOrderId: result.serviceOrderId,
    });
  } catch (err) {
    if (err instanceof EvidenceRejectedError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    logger.error("eligibility.submit_failed", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
