import type { Email } from "../../shared/email.vo";
import type { Invitation } from "./invitation.entity";

export interface IInvitationRepository {
  findById(id: string): Promise<Invitation | null>;
  /** The accept-flow lookup: the invitee arrives holding the raw token, which is hashed to match. */
  findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  /**
   * Pending invitations for an address within an organization. Lets the invite
   * use-case avoid issuing a duplicate outstanding invitation to the same person.
   */
  findPendingByOrganizationAndEmail(
    organizationId: string,
    email: Email,
  ): Promise<Invitation | null>;
  findByOrganizationId(organizationId: string): Promise<Invitation[]>;
  save(invitation: Invitation): Promise<void>;
}
