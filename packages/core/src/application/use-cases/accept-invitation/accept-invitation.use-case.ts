import { Member } from "../../../domain/member/member.entity";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../shared/errors";
import type { IClock, IIdGenerator, ITokenHasher } from "../../ports";
import type { IUnitOfWork } from "../../ports/unit-of-work";
import type { IUseCase } from "../use-case";

export type AcceptInvitationInput = {
  /** The raw token from the invitation link. */
  token: string;
  /** The authenticated user accepting the invitation. */
  acceptingUserId: string;
};

/**
 * Accepts an invitation: creates the member and marks the invitation accepted,
 * atomically.
 *
 * The whole read-validate-write sequence runs inside one transaction. That's what makes
 * two concurrent accepts of the same invitation safe: the loser hits a write conflict,
 * `withTransaction` retries it, and on retry the invitation is already accepted so
 * `invitation.accept()` throws ConflictError. The Member unique index is the second
 * backstop.
 */
export class AcceptInvitationUseCase implements IUseCase<
  AcceptInvitationInput,
  Member
> {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly tokenHasher: ITokenHasher,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock,
  ) {}

  async execute(input: AcceptInvitationInput): Promise<Member> {
    const tokenHash = this.tokenHasher.hash(input.token);
    const now = this.clock.now();

    return this.unitOfWork.run(async (repos) => {
      const invitation = await repos.invitations.findByTokenHash(tokenHash);
      if (invitation === null) {
        throw new NotFoundError("Invitation not found");
      }

      const user = await repos.users.findById(input.acceptingUserId);
      if (user === null) {
        throw new NotFoundError("User not found");
      }

      // The invitation was addressed to an email; only the owner of that email may accept.
      if (!user.email.equals(invitation.email)) {
        throw new ForbiddenError(
          "This invitation was sent to a different email address",
        );
      }

      const alreadyMember = await repos.members.findByOrganizationAndUser(
        invitation.organizationId,
        user.id,
      );
      if (alreadyMember !== null) {
        throw new ConflictError(
          "User is already a member of this organization",
        );
      }

      // Throws ConflictError if the invitation isn't pending or has expired.
      invitation.accept(now);

      const member = Member.create({
        id: this.idGenerator.generate(),
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
        now,
      });

      await repos.members.save(member);
      await repos.invitations.save(invitation);

      return member;
    });
  }
}
