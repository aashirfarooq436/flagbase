import type { Organization } from "../../domain/organization/organization.entity";
import type { IOrganizationRepository } from "../../domain/organization/organization.repository";

/** An in-memory IOrganizationRepository for testing use-cases with zero infrastructure. */
export class InMemoryOrganizationRepository implements IOrganizationRepository {
  private readonly store = new Map<string, Organization>();

  constructor(seed: Organization[] = []) {
    for (const organization of seed) {
      this.store.set(organization.id, organization);
    }
  }

  async findById(id: string): Promise<Organization | null> {
    return this.store.get(id) ?? null;
  }

  async save(organization: Organization): Promise<void> {
    this.store.set(organization.id, organization);
  }
}
