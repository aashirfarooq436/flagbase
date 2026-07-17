import type { Organization } from "../../../../domain/organization/organization.entity";
import type { IOrganizationRepository } from "../../../../domain/organization/organization.repository";
import type { IMemberRepository } from "../../../../domain/member/member.repository";
import type { IUseCase } from "../../use-case";

export type ListMyOrganizationsInput = {
  userId: string;
};

/**
 * Lists the organizations a user belongs to — the dashboard's org switcher.
 *
 * Membership is the source of truth (a User holds no orgId), so this reads the user's
 * memberships and loads each organization.
 */
export class ListMyOrganizationsUseCase
  implements IUseCase<ListMyOrganizationsInput, Organization[]>
{
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(input: ListMyOrganizationsInput): Promise<Organization[]> {
    const memberships = await this.memberRepository.findByUserId(input.userId);

    const organizations = await Promise.all(
      memberships.map((membership) =>
        this.organizationRepository.findById(membership.organizationId),
      ),
    );

    // Filter any that no longer exist (defensive against orphaned memberships).
    return organizations.filter(
      (organization): organization is Organization => organization !== null,
    );
  }
}
