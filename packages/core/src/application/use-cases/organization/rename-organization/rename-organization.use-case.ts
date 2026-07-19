import type { Organization } from "../../../../domain/organization/organization.entity";
import type { IOrganizationRepository } from "../../../../domain/organization/organization.repository";
import { NotFoundError } from "../../../../shared/errors";
import type { IUseCase } from "../../use-case";

export type RenameOrganizationInput = {
  organizationId: string;
  name: string;
};

/** Renames an organization. In v1 the name is the only editable organization setting. */
export class RenameOrganizationUseCase implements IUseCase<
  RenameOrganizationInput,
  Organization
> {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(input: RenameOrganizationInput): Promise<Organization> {
    const organization = await this.organizationRepository.findById(
      input.organizationId,
    );
    if (organization === null) {
      throw new NotFoundError(`Organization ${input.organizationId} not found`);
    }

    organization.rename(input.name);
    await this.organizationRepository.save(organization);
    return organization;
  }
}
