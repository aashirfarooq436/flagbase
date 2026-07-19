import type { IMemberRepository } from "../../../../domain/member/member.repository";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import { assertResourceInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

export type RemoveMemberInput = {
  organizationId: string;
  memberId: string;
};

/**
 * Removes a member from an organization.
 *
 * Refuses to remove the owner — that would leave the organization with no owner,
 * violating "exactly one owner". Removing the owner is only possible by transferring
 * ownership first (a separate operation).
 */
export class RemoveMemberUseCase implements IUseCase<RemoveMemberInput, void> {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(input: RemoveMemberInput): Promise<void> {
    const member = await this.memberRepository.findById(input.memberId);
    if (member === null) {
      throw new NotFoundError(`Member ${input.memberId} not found`);
    }

    assertResourceInOrganization(member, input.organizationId, "Member");

    if (member.isOwner) {
      throw new ForbiddenError(
        "Cannot remove the owner; transfer ownership first",
      );
    }

    await this.memberRepository.delete(input.memberId);
  }
}
