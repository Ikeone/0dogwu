/**
 * Customer notification outbox. Notifications are represented as records with a
 * PII-minimised preview (no full address/email/phone). The console providers
 * "send" them and we persist a safe preview only.
 */
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/providers/factory";
import { redactText } from "@/lib/domain/redaction";

export async function sendNotification(
  orderId: string,
  template: string,
  subject: string,
) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { application: { include: { user: true } } },
  });
  const to = order?.application.contactEmail ?? "unknown@example.nz";
  const userId = order?.application.userId ?? null;

  const { preview } = await getEmailProvider().send({
    to,
    template,
    subject,
    data: { orderRef: order?.reference ?? "" },
  });

  await prisma.customerNotification.create({
    data: {
      userId,
      channel: "email",
      template,
      subject: redactText(subject),
      preview,
    },
  });
}
