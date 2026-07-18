import { Member } from "../../../../domain/member/member.entity";
import { Role } from "../../../../domain/member/role";
import { Organization } from "../../../../domain/organization/organization.entity";
import type { IClock, IIdGenerator } from "../../../ports";
import type { IUnitOfWork } from "../../../ports/unit-of-work";
import type { IUseCase } from "../../use-case";

export type CreateOrganizationInput = {
  name: string;
  /** The user who will own the new organization — the authenticated actor. */
  ownerUserId: string;
};

/**
 * Creates an organization and its owner membership atomically.
 *
 * This is the reason the Unit of Work exists: an Organization with no owner Member
 * violates the "exactly one owner" invariant and can't be detected after the fact.
 * Both writes commit together or neither does. Validation (the org name) happens before
 * the transaction opens, so a bad name never starts one.
 */
export class CreateOrganizationUseCase implements IUseCase<
  CreateOrganizationInput,
  Organization
> {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock,
  ) {}

  async execute(input: CreateOrganizationInput): Promise<Organization> {
    const now = this.clock.now();

    const organization = Organization.create({
      id: this.idGenerator.generate(),
      name: input.name,
      now,
    });

    const owner = Member.create({
      id: this.idGenerator.generate(),
      organizationId: organization.id,
      userId: input.ownerUserId,
      role: Role.Owner,
      now,
    });

    await this.unitOfWork.run(async (repos) => {
      await repos.organizations.save(organization);
      await repos.members.save(owner);
    });

    return organization;
  }
}
