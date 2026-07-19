import type { Organization } from "../../../../domain/organization/organization.entity";
import type { IOrganizationRepository } from "../../../../domain/organization/organization.repository";
import { NotFoundError } from "../../../../shared/errors";
import type { IUseCase } from "../../use-case";

export type GetOrganizationInput = {
  organizationId: string;
};

/** Fetches a single organization. The caller's membership is checked by the delivery layer. */
export class GetOrganizationUseCase implements IUseCase<
  GetOrganizationInput,
  Organization
> {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(input: GetOrganizationInput): Promise<Organization> {
    const organization = await this.organizationRepository.findById(
      input.organizationId,
    );
    if (organization === null) {
      throw new NotFoundError(`Organization ${input.organizationId} not found`);
    }
    return organization;
  }
}
