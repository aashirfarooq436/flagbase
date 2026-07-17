import type { Member } from "../../../../domain/member/member.entity";
import type { IMemberRepository } from "../../../../domain/member/member.repository";
import { Role } from "../../../../domain/member/role.vo";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import type { IUseCase } from "../../use-case";

export type ChangeMemberRoleInput = {
  organizationId: string;
  memberId: string;
  newRole: Role;
};

/**
 * Changes a member's role — between Admin and Member.
 *
 * Two owner guards keep "exactly one owner" intact: you cannot assign the Owner role
 * (ownership is transferred, a separate operation), and you cannot change the current
 * owner's role (that would leave the organization ownerless). Both are domain rules the
 * use-case can enforce because it loads the member.
 */
export class ChangeMemberRoleUseCase
  implements IUseCase<ChangeMemberRoleInput, Member>
{
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(input: ChangeMemberRoleInput): Promise<Member> {
    const member = await this.memberRepository.findById(input.memberId);
    if (member === null) {
      throw new NotFoundError(`Member ${input.memberId} not found`);
    }

    if (member.organizationId !== input.organizationId) {
      throw new ForbiddenError("Member does not belong to this organization");
    }

    if (input.newRole === Role.Owner) {
      throw new ForbiddenError(
        "Ownership is transferred, not assigned via a role change",
      );
    }

    if (member.isOwner) {
      throw new ForbiddenError(
        "Cannot change the owner's role; transfer ownership first",
      );
    }

    member.changeRole(input.newRole);
    await this.memberRepository.save(member);
    return member;
  }
}
