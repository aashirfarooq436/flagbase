import type { Member } from "../../../../domain/member/member.entity";
import type { IMemberRepository } from "../../../../domain/member/member.repository";
import type { IUseCase } from "../../use-case";

export type ListMembersInput = {
  organizationId: string;
};

/**
 * Lists an organization's members. Returns the Member entities (userId + role); enriching
 * them with user names/emails is a delivery-layer join, not the domain's concern.
 */
export class ListMembersUseCase
  implements IUseCase<ListMembersInput, Member[]>
{
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(input: ListMembersInput): Promise<Member[]> {
    return this.memberRepository.findByOrganizationId(input.organizationId);
  }
}
