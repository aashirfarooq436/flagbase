import type { Organization } from "../../../../domain/organization/organization.entity";
import type { IOrganizationRepository } from "../../../../domain/organization/organization.repository";
import { Slug } from "../../../../domain/organization/slug.vo";
import { NotFoundError } from "../../../../shared/errors";
import type { IUseCase } from "../../use-case";

export type GetOrganizationBySlugInput = {
  slug: string;
};

/**
 * Resolves an organization by its URL slug — how the dashboard turns `/{slug}/...` back into an
 * organization. The caller's membership is checked separately by the delivery layer.
 */
export class GetOrganizationBySlugUseCase implements IUseCase<
  GetOrganizationBySlugInput,
  Organization
> {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(input: GetOrganizationBySlugInput): Promise<Organization> {
    const organization = await this.organizationRepository.findBySlug(
      new Slug(input.slug),
    );
    if (organization === null) {
      throw new NotFoundError(`Organization "${input.slug}" not found`);
    }
    return organization;
  }
}
