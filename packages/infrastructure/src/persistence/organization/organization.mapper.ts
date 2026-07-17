import { Organization } from "@flagbase/core";

import type { OrganizationDocument } from "./organization.model";

export class OrganizationMapper {
  static toDomain(document: OrganizationDocument): Organization {
    return new Organization({
      id: document._id,
      name: document.name,
      createdAt: document.createdAt,
    });
  }

  static toDocument(organization: Organization): OrganizationDocument {
    return {
      _id: organization.id,
      name: organization.name,
      createdAt: organization.createdAt,
    };
  }
}
