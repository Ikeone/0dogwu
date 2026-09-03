/**
 * Operational + unit-economics metrics for the admin dashboard.
 * All financial figures are ESTIMATES derived from configurable values and are
 * never shown in the customer portal.
 */
import { prisma } from "@/lib/db";
import { getBusinessConfig } from "./config";
import { modemContribution, monthlyPrice, unitEconomics } from "@/lib/domain/pricing";

export interface DashboardMetrics {
  applicationsThisWeek: number;
  eligibilitySuccessRate: number; // 0..1
  needsManualReview: number;
  provisioningExceptions: number;
  availableStock: number;
  awaitingAssignment: number;
  failedPayments: number;
  activeServices: number;
  mrrCents: number;
  estimatedMonthlyContributionCents: number;
  supportConversationsPerActive: number;
  escalationsPerHundredApplications: number;
  integrationJobFailures: number;
  economics: ReturnType<typeof unitEconomics>;
  modem: ReturnType<typeof modemContribution>;
  price: ReturnType<typeof monthlyPrice>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const cfg = await getBusinessConfig();
  const weekAgo = new Date(Date.now() - 7 * 86400_000);

  const [
    applicationsThisWeek,
    totalDecided,
    eligibleCount,
    needsManualReview,
    provisioningExceptions,
    availableStock,
    awaitingAssignment,
    failedPayments,
    activeServices,
    conversations,
    totalApplications,
    escalations,
    integrationJobFailures,
    activeSubs,
  ] = await Promise.all([
    prisma.eligibilityApplication.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.eligibilityApplication.count({ where: { status: { in: ["ELIGIBLE", "INELIGIBLE"] } } }),
    prisma.eligibilityApplication.count({ where: { status: "ELIGIBLE" } }),
    prisma.eligibilityApplication.count({ where: { status: "MANUAL_REVIEW" } }),
    prisma.serviceOrder.count({ where: { status: "PROVISIONING_BLOCKED" } }),
    prisma.modemDevice.count({ where: { status: "AVAILABLE" } }),
    prisma.serviceOrder.count({ where: { status: "MODEM_PAYMENT_CONFIRMED" } }),
    prisma.paymentTransaction.count({ where: { status: "failed" } }),
    prisma.serviceOrder.count({ where: { status: "ACTIVE" } }),
    prisma.supportConversation.count(),
    prisma.eligibilityApplication.count(),
    prisma.supportTicket.count(),
    prisma.integrationJob.count({ where: { status: { in: ["FAILED", "DEAD_LETTER"] } } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" } }),
  ]);

  const eco = unitEconomics(cfg);
  const mrrCents = activeSubs.reduce((sum, s) => sum + s.monthlyPriceCents, 0);
  const estimatedMonthlyContributionCents = activeSubs.length * eco.estimatedContributionCents;

  return {
    applicationsThisWeek,
    eligibilitySuccessRate: totalDecided > 0 ? eligibleCount / totalDecided : 0,
    needsManualReview,
    provisioningExceptions,
    availableStock,
    awaitingAssignment,
    failedPayments,
    activeServices,
    mrrCents,
    estimatedMonthlyContributionCents,
    supportConversationsPerActive:
      activeServices > 0 ? conversations / activeServices : conversations,
    escalationsPerHundredApplications:
      totalApplications > 0 ? (escalations / totalApplications) * 100 : 0,
    integrationJobFailures,
    economics: eco,
    modem: modemContribution(cfg),
    price: monthlyPrice(cfg),
  };
}
