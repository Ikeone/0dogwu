/**
 * Demo seed. Creates synthetic (never real) data:
 *  - Organisation, staff users (one-click demo logins), product plan.
 *  - Knowledge base.
 *  - Modem inventory.
 *  - Customers + scenarios A-G, driven through the REAL service functions so
 *    the resulting state is genuine (not hand-written rows).
 *
 * Env is set here so `tsx prisma/seed.ts` works with zero configuration. All
 * app modules are dynamically imported AFTER env is set (so the Prisma client
 * and env validation see the right values).
 */
process.env.DATABASE_URL ??= "file:./dev.db";
process.env.APP_ENV ??= "development";
process.env.DEMO_MODE ??= "true";
process.env.AUTH_SECRET ??= "dev-only-insecure-change-me";
process.env.FIELD_ENCRYPTION_KEY ??= "dev-only-insecure-change-me-32byte";

async function main() {
  const { prisma } = await import("../src/lib/db");
  const { hashPassword } = await import("../src/lib/auth/password");
  const { KNOWLEDGE_ARTICLES } = await import("../src/lib/knowledge/articles");
  const { importModems } = await import("../src/lib/services/modems");
  const { submitApplication } = await import("../src/lib/services/applications");
  const { createModemCheckout } = await import("../src/lib/services/payments");
  const { runDemoEvent } = await import("../src/lib/services/demo");
  const { askSupport } = await import("../src/lib/services/support");
  const { DEFAULT_BUSINESS_CONFIG } = await import("../src/lib/config/business");

  console.log("Resetting demo data…");
  // Clear in FK-safe order.
  await prisma.$transaction([
    prisma.paymentEvent.deleteMany(),
    prisma.billingFailure.deleteMany(),
    prisma.paymentTransaction.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.shipmentEvent.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.provisioningEvent.deleteMany(),
    prisma.provisioningRequest.deleteMany(),
    prisma.integrationAttempt.deleteMany(),
    prisma.integrationJob.deleteMany(),
    prisma.webhookEvent.deleteMany(),
    prisma.externalOrderReference.deleteMany(),
    prisma.modemAssignment.deleteMany(),
    prisma.modemDevice.deleteMany(),
    prisma.modemModel.deleteMany(),
    prisma.supportMessage.deleteMany(),
    prisma.supportTicket.deleteMany(),
    prisma.supportConversation.deleteMany(),
    prisma.customerNotification.deleteMany(),
    prisma.eligibilityRuleResult.deleteMany(),
    prisma.eligibilityDecision.deleteMany(),
    prisma.eligibilityEvidence.deleteMany(),
    prisma.consentRecord.deleteMany(),
    prisma.serviceOrder.deleteMany(),
    prisma.eligibilityApplication.deleteMany(),
    prisma.address.deleteMany(),
    prisma.knowledgeArticle.deleteMany(),
    prisma.configurationChange.deleteMany(),
    prisma.systemConfiguration.deleteMany(),
    prisma.auditEvent.deleteMany(),
    prisma.securityEvent.deleteMany(),
    prisma.privacyRequest.deleteMany(),
    prisma.session.deleteMany(),
    prisma.customerProfile.deleteMany(),
    prisma.staffProfile.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.referralSource.deleteMany(),
    prisma.productPlan.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organisation.deleteMany(),
  ]);

  const org = await prisma.organisation.create({ data: { name: "Wireless Nation" } });

  // --- Staff (one-click demo logins; DEMO password only) --------------------
  const DEMO_PASSWORD = "demo1234";
  const staff: { email: string; name: string; roles: string; title: string; offshore?: boolean }[] = [
    { email: "admin@wn.demo", name: "Ava Admin", roles: "SUPER_ADMIN", title: "Platform Administrator" },
    { email: "ops@wn.demo", name: "Omar Operations", roles: "OPERATIONS", title: "Operations Specialist" },
    { email: "support@wn.demo", name: "Sam Support", roles: "SUPPORT", title: "Support Agent" },
    { email: "finance@wn.demo", name: "Fern Finance", roles: "FINANCE", title: "Finance Analyst" },
    { email: "privacy@wn.demo", name: "Priya Privacy", roles: "PRIVACY_OFFICER", title: "Privacy Officer" },
    { email: "offshore@wn.demo", name: "Otto Offshore", roles: "READ_ONLY", title: "Offshore Operations", offshore: true },
  ];
  for (const s of staff) {
    const u = await prisma.user.create({
      data: {
        organisationId: org.id,
        email: s.email,
        displayName: s.name,
        roles: s.roles,
        isStaff: true,
        passwordHash: hashPassword(DEMO_PASSWORD),
      },
    });
    await prisma.staffProfile.create({
      data: { userId: u.id, jobTitle: s.title, offshore: s.offshore ?? false },
    });
  }

  // --- Product plan + referral source ---------------------------------------
  const plan = DEFAULT_BUSINESS_CONFIG.plan;
  await prisma.productPlan.create({
    data: {
      code: plan.code,
      name: plan.name,
      downloadMbps: plan.downloadMbps,
      uploadMbps: plan.uploadMbps,
      monthlyPriceCents: plan.consumerPriceCents,
    },
  });
  await prisma.referralSource.create({
    data: { code: "DIRECT", label: "Direct application", channel: "direct" },
  });

  // --- Knowledge base --------------------------------------------------------
  for (const a of KNOWLEDGE_ARTICLES) {
    await prisma.knowledgeArticle.create({
      data: {
        slug: a.slug,
        title: a.title,
        body: a.body,
        tagsJson: JSON.stringify(a.tags),
        published: true,
        needsReview: a.needsReview ?? false,
      },
    });
  }

  // --- Modem inventory -------------------------------------------------------
  const devices = Array.from({ length: 12 }, (_, i) => {
    const n = (i + 1).toString().padStart(2, "0");
    // Build a valid unicast MAC (first octet even).
    const mac = `A4:B1:C2:00:00:${n}`;
    return {
      assetId: `WN-ASSET-${1000 + i}`,
      manufacturer: "GenericCo",
      model: "GX-100 (unconfirmed)",
      serialNumber: `SN${100000 + i}`,
      wanMac: mac,
      supplierBatch: "BATCH-2025-09",
    };
  });
  const importResult = await importModems(devices);
  console.log(`Imported ${importResult.imported} modems (${importResult.skipped.length} skipped).`);

  // --- Helper to create a customer + submit an application -------------------
  async function customer(email: string, name: string) {
    return prisma.user.create({
      data: {
        organisationId: org.id,
        email,
        displayName: name,
        isStaff: false,
        passwordHash: hashPassword(DEMO_PASSWORD),
        customerProfile: { create: { fullName: name, contactPref: "email" } },
      },
    });
  }

  async function apply(
    userId: string,
    placeRef: string,
    housing: "public_housing" | "community_housing" | "none",
    evidence: "community_services_card" | "msd_benefit_letter" | "none",
    evidenceProvided: boolean,
    name: string,
    email: string,
    scenario: string,
  ) {
    return submitApplication({
      userId,
      placeRef,
      addressLine: `${10 + placeRef.length} Rimu Lane`,
      suburb: "Riverton",
      city: "Demoville",
      postcode: "7910",
      housingCategory: housing,
      evidenceType: evidence,
      evidenceProvided,
      contactName: name,
      contactEmail: email,
      contactPhone: "021000000",
      serviceConsent: true,
      marketingConsent: false,
      policyVersion: "v1.0-demo",
      scenarioTag: scenario,
    });
  }

  const ACTOR = "seed";

  // Scenario A: fully eligible -> paid -> provisioned -> shipped -> active.
  {
    const u = await customer("aroha.customer@demo.nz", "Aroha Ngata");
    const res = await apply(u.id, "PLACE-ELIGIBLE-42", "public_housing", "community_services_card", true, "Aroha Ngata", "aroha.customer@demo.nz", "A");
    const orderId = res.serviceOrderId!;
    await createModemCheckout(orderId);
    await runDemoEvent("payment_successful", orderId, ACTOR);
    await runDemoEvent("process_jobs", orderId, ACTOR); // provisioning completes
    await runDemoEvent("modem_packed", orderId, ACTOR);
    await runDemoEvent("modem_shipped", orderId, ACTOR);
    await runDemoEvent("modem_delivered", orderId, ACTOR);
    await runDemoEvent("service_activated", orderId, ACTOR);
    await askSupport("How do I connect my modem to the ONT?", u.id);
    console.log(`Scenario A ready: ${res.reference} (login aroha.customer@demo.nz)`);
  }

  // Scenario B: recently active -> ineligible.
  {
    const u = await customer("ben.customer@demo.nz", "Ben Carter");
    const res = await apply(u.id, "PLACE-ACTIVE-13", "public_housing", "community_services_card", true, "Ben Carter", "ben.customer@demo.nz", "B");
    console.log(`Scenario B ready: ${res.reference} -> ${res.decision.outcome}`);
  }

  // Scenario C: information required (no evidence provided).
  {
    const u = await customer("chloe.customer@demo.nz", "Chloe Reed");
    const res = await apply(u.id, "PLACE-ELIGIBLE-77", "public_housing", "none", false, "Chloe Reed", "chloe.customer@demo.nz", "C");
    console.log(`Scenario C ready: ${res.reference} -> ${res.decision.outcome}`);
  }

  // Scenario D: manual review (conflicting provider data).
  {
    const u = await customer("dan.customer@demo.nz", "Dan Ilalio");
    const res = await apply(u.id, "PLACE-CONFLICT-9", "community_housing", "community_services_card", true, "Dan Ilalio", "dan.customer@demo.nz", "D");
    console.log(`Scenario D ready: ${res.reference} -> ${res.decision.outcome}`);
  }

  // Scenario E: payment fails then succeeds (no duplicate charge).
  {
    const u = await customer("esther.customer@demo.nz", "Esther Malo");
    const res = await apply(u.id, "PLACE-ELIGIBLE-31", "public_housing", "community_services_card", true, "Esther Malo", "esther.customer@demo.nz", "E");
    const orderId = res.serviceOrderId!;
    await createModemCheckout(orderId);
    await runDemoEvent("payment_failed", orderId, ACTOR);
    await createModemCheckout(orderId); // customer retries
    await runDemoEvent("payment_successful", orderId, ACTOR);
    await runDemoEvent("process_jobs", orderId, ACTOR);
    console.log(`Scenario E ready: ${res.reference} (paid after retry)`);
  }

  // Scenario F: transient provisioning failure then automatic retry success.
  {
    const u = await customer("finn.customer@demo.nz", "Finn Aupito");
    const res = await apply(u.id, "PLACE-ELIGIBLE-55", "public_housing", "community_services_card", true, "Finn Aupito", "finn.customer@demo.nz", "F");
    const orderId = res.serviceOrderId!;
    await createModemCheckout(orderId);
    await runDemoEvent("payment_successful", orderId, ACTOR);
    await runDemoEvent("process_jobs", orderId, ACTOR); // attempt 1 -> transient fault (blocked)
    await runDemoEvent("process_jobs", orderId, ACTOR); // attempt 2 -> success
    console.log(`Scenario F ready: ${res.reference} (retry succeeded)`);
  }

  // Scenario G: active service, failed monthly payment -> grace period.
  {
    const u = await customer("grace.customer@demo.nz", "Grace Timu");
    const res = await apply(u.id, "PLACE-ELIGIBLE-88", "public_housing", "community_services_card", true, "Grace Timu", "grace.customer@demo.nz", "G");
    const orderId = res.serviceOrderId!;
    await createModemCheckout(orderId);
    await runDemoEvent("payment_successful", orderId, ACTOR);
    await runDemoEvent("process_jobs", orderId, ACTOR);
    await runDemoEvent("modem_delivered", orderId, ACTOR);
    await runDemoEvent("service_activated", orderId, ACTOR);
    await runDemoEvent("monthly_payment_failure", orderId, ACTOR); // -> grace period
    console.log(`Scenario G ready: ${res.reference} (in grace period)`);
  }

  const counts = {
    users: await prisma.user.count(),
    applications: await prisma.eligibilityApplication.count(),
    orders: await prisma.serviceOrder.count(),
    devices: await prisma.modemDevice.count(),
    articles: await prisma.knowledgeArticle.count(),
    audit: await prisma.auditEvent.count(),
  };
  console.log("Seed complete:", counts);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
