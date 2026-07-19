import type { Invitation } from "../../../../domain/invitation/invitation.entity";
import type { IInvitationRepository } from "../../../../domain/invitation/invitation.repository";
import { NotFoundError } from "../../../../shared/errors";
import { assertResourceInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

export type RevokeInvitationInput = {
  organizationId: string;
  invitationId: string;
};

/**
 * The organization cancels a pending invitation (identified by id, from the members UI).
 * Distinct from reject, which the invitee triggers via the token.
 */
export class RevokeInvitationUseCase implements IUseCase<
  RevokeInvitationInput,
  Invitation
> {
  constructor(private readonly invitationRepository: IInvitationRepository) {}

  async execute(input: RevokeInvitationInput): Promise<Invitation> {
    const invitation = await this.invitationRepository.findById(
      input.invitationId,
    );
    if (invitation === null) {
      throw new NotFoundError(`Invitation ${input.invitationId} not found`);
    }

    assertResourceInOrganization(
      invitation,
      input.organizationId,
      "Invitation",
    );

    invitation.revoke(); // throws ConflictError if not pending
    await this.invitationRepository.save(invitation);
    return invitation;
  }
}
