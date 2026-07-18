import type { Member } from "../../../../domain/member/member.entity";
import type { IMemberRepository } from "../../../../domain/member/member.repository";
import type { IUseCase } from "../../use-case";

export type GetMembershipInput = {
  organizationId: string;
  userId: string;
};

/**
 * Fetches a user's membership in an organization — the role the delivery layer builds its
 * CASL ability from.
 *
 * Returns null when the user is not a member: not an error, but the signal the delivery layer
 * turns into a 403. This is also the tenant boundary for org-scoped routes — a user with a
 * valid session but no membership in the requested org must not see it.
 */
export class GetMembershipUseCase
  implements IUseCase<GetMembershipInput, Member | null>
{
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(input: GetMembershipInput): Promise<Member | null> {
    return this.memberRepository.findByOrganizationAndUser(
      input.organizationId,
      input.userId,
    );
  }
}
