import { composition } from "@flagbase/composition";
import { renameOrganizationRequestSchema } from "@flagbase/contracts";

import { toOrganizationResponse } from "@/lib/presenters/organization.presenter";
import { route } from "@/lib/route";

export const GET = route({
  access: "organization",
  action: "read",
  subject: "Organization",
  handle: async ({ context }) => {
    const organization = await composition.organization.get.execute({
      organizationId: context.organizationId,
    });
    return toOrganizationResponse(organization);
  },
});

export const PATCH = route({
  access: "organization",
  action: "update",
  subject: "Organization",
  body: renameOrganizationRequestSchema,
  handle: async ({ body, context }) => {
    const organization = await composition.organization.rename.execute({
      organizationId: context.organizationId,
      name: body.name,
    });
    return toOrganizationResponse(organization);
  },
});
