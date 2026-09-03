import type {
  NotificationInput,
  NotificationProvider,
} from "@/lib/providers/types";
import { maskEmail, redactText } from "@/lib/domain/redaction";
import { logger } from "@/lib/logger";

/**
 * Console notification providers. In demo mode these just log a redacted line
 * and return a PII-minimised preview stored in the CustomerNotification outbox.
 * The full recipient address is never persisted in the preview.
 */
export class ConsoleEmailProvider implements NotificationProvider {
  readonly name = "console-email";
  readonly channel = "email" as const;

  async send(input: NotificationInput): Promise<{ preview: string }> {
    logger.info("email.send", { to: maskEmail(input.to), template: input.template });
    const preview = redactText(
      `To ${maskEmail(input.to)} — ${input.subject}`,
    );
    return { preview };
  }
}

export class ConsoleSmsProvider implements NotificationProvider {
  readonly name = "console-sms";
  readonly channel = "sms" as const;

  async send(input: NotificationInput): Promise<{ preview: string }> {
    logger.info("sms.send", { template: input.template });
    return { preview: redactText(`SMS — ${input.subject}`) };
  }
}
