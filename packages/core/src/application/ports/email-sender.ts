import type { Email } from "../../shared/email.vo";

/**
 * Sends transactional email.
 *
 * The methods are semantic (`sendInvitation`, not `send(subject, body)`) on purpose:
 * subject lines and templates are presentation, and presentation does not belong in the
 * domain. The application decides an invitation must go out and supplies the token;
 * infrastructure decides what the email looks like.
 */
export interface IEmailSender {
  sendInvitation(
    to: Email,
    token: string,
    organizationName: string,
  ): Promise<void>;
}
