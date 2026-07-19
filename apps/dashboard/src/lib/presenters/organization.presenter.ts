import type { OrganizationResponse } from "@flagbase/contracts";
import type { Organization } from "@flagbase/core";

/** Maps an Organization entity to its wire DTO. */
export function toOrganizationResponse(
  organization: Organization,
): OrganizationResponse {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug.value,
    createdAt: organization.createdAt.toISOString(),
  };
}
