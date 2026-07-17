import type { Email, IEmailSender } from "@flagbase/core";

export type Logger = (message: string) => void;

/**
 * A development IEmailSender that logs what it would send instead of sending it.
 *
 * Unblocks the full local flow (the invitation token is printed so you can accept it)
 * with no provider, no API key, no network. Swap in a real adapter (Resend, SES, SMTP)
 * for deployment — it's a single class implementing the same interface.
 */
export class ConsoleEmailSender implements IEmailSender {
  constructor(private readonly log: Logger = console.log) {}

  async sendInvitation(
    to: Email,
    token: string,
    organizationName: string,
  ): Promise<void> {
    this.log(
      `[email] Invitation to ${to.value} — join "${organizationName}". Token: ${token}`,
    );
  }
}
