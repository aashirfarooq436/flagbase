import type { Organization } from "./organization.entity";
import type { Slug } from "./slug.vo";

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: Slug): Promise<Organization | null>;
  save(organization: Organization): Promise<void>;
}
