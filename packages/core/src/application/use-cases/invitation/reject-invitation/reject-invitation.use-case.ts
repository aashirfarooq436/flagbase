import type { Invitation } from "../../../../domain/invitation/invitation.entity";
import type { IInvitationRepository } from "../../../../domain/invitation/invitation.repository";
import { NotFoundError } from "../../../../shared/errors";
import type { ITokenHasher } from "../../../ports";
import type { IUseCase } from "../../use-case";

export type RejectInvitationInput = {
  /** The raw token from the invitation link. */
  token: string;
};

/**
 * The invitee declines an invitation via its token.
 *
 * Identified by the token, not an id: whoever holds the invitation link has the authority
 * to decline it, and the invitee may not even have an account. Lower-stakes than accept,
 * which is why it needs no authenticated user or email match.
 */
export class RejectInvitationUseCase implements IUseCase<
  RejectInvitationInput,
  Invitation
> {
  constructor(
    private readonly invitationRepository: IInvitationRepository,
    private readonly tokenHasher: ITokenHasher,
  ) {}

  async execute(input: RejectInvitationInput): Promise<Invitation> {
    const tokenHash = this.tokenHasher.hash(input.token);

    const invitation =
      await this.invitationRepository.findByTokenHash(tokenHash);
    if (invitation === null) {
      throw new NotFoundError("Invitation not found");
    }

    invitation.reject(); // throws ConflictError if not pending
    await this.invitationRepository.save(invitation);
    return invitation;
  }
}
