import type { Organization } from "../../domain/organization/organization.entity";
import type { IOrganizationRepository } from "../../domain/organization/organization.repository";
import type { Slug } from "../../domain/organization/slug.vo";

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

  async findBySlug(slug: Slug): Promise<Organization | null> {
    for (const organization of this.store.values()) {
      if (organization.slug.equals(slug)) {
        return organization;
      }
    }
    return null;
  }

  async save(organization: Organization): Promise<void> {
    this.store.set(organization.id, organization);
  }
}
