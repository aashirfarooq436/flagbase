import { Organization } from "@flagbase/core";

import type { OrganizationDocument } from "./mongo-organization.model";

export class OrganizationMapper {
  static toDomain(document: OrganizationDocument): Organization {
    return new Organization({
      id: document._id,
      name: document.name,
      slug: document.slug,
      createdAt: document.createdAt,
    });
  }

  static toDocument(organization: Organization): OrganizationDocument {
    return {
      _id: organization.id,
      name: organization.name,
      slug: organization.slug.value,
      createdAt: organization.createdAt,
    };
  }
}
