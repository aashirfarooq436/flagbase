import type { Email, IEmailSender } from "@flagbase/core";
import { ConsoleLogger, type Logger } from "@flagbase/shared/logger";

/**
 * A development IEmailSender that logs what it would send instead of sending it.
 *
 * Unblocks the full local flow (the invitation token is printed so you can accept it)
 * with no provider, no API key, no network. Swap in a real adapter (Resend, SES, SMTP)
 * for deployment — it's a single class implementing the same interface.
 */
export class ConsoleEmailSender implements IEmailSender {
  private readonly logger: Logger;

  constructor(
    logger: Logger = new ConsoleLogger({
      context: { adapter: "ConsoleEmailSender" },
    }),
  ) {
    this.logger = logger;
  }

  async sendInvitation(
    to: Email,
    token: string,
    organizationName: string,
  ): Promise<void> {
    this.logger.info(
      `Invitation to ${to.value} — join "${organizationName}". Token: ${token}`,
    );
  }
}
