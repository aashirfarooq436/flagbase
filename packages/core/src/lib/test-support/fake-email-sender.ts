import type { IEmailSender } from "../../application/ports";
import type { Email } from "../../shared/email.vo";

export type SentInvitation = {
  to: Email;
  token: string;
  organizationName: string;
};

/**
 * An IEmailSender that records what it "sent" instead of sending it, so tests can assert
 * an invitation email went out — with the raw token and organization name.
 */
export class FakeEmailSender implements IEmailSender {
  readonly sentInvitations: SentInvitation[] = [];

  async sendInvitation(
    to: Email,
    token: string,
    organizationName: string,
  ): Promise<void> {
    this.sentInvitations.push({ to, token, organizationName });
  }
}
