import {
  type Invitation,
  InvitationStatus,
} from "../../../../domain/invitation/invitation.entity";
import type { IInvitationRepository } from "../../../../domain/invitation/invitation.repository";
import type { IUseCase } from "../../use-case";

export type ListPendingInvitationsInput = {
  organizationId: string;
};

/**
 * Lists an organization's outstanding (pending) invitations for the members UI.
 *
 * Filters to Pending here rather than in the repository — expiry is computed, so an
 * expired-but-not-yet-acted invitation is still Pending; the delivery layer can mark it
 * expired from expiresAt when rendering.
 */
export class ListPendingInvitationsUseCase
  implements IUseCase<ListPendingInvitationsInput, Invitation[]>
{
  constructor(
    private readonly invitationRepository: IInvitationRepository,
  ) {}

  async execute(input: ListPendingInvitationsInput): Promise<Invitation[]> {
    const invitations = await this.invitationRepository.findByOrganizationId(
      input.organizationId,
    );
    return invitations.filter(
      (invitation) => invitation.status === InvitationStatus.Pending,
    );
  }
}
