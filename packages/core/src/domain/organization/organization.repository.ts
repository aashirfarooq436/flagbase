import type { Organization } from "./organization.entity";

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  save(organization: Organization): Promise<void>;
}
