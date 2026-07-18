import { composition } from "@flagbase/composition";
import { createOrganizationRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";

import { toOrganizationResponse } from "@/lib/presenters/organization.presenter";
import { route } from "@/lib/route";

export const GET = route({
  access: "user",
  handle: async ({ context }) => {
    const organizations = await composition.organization.listMine.execute({
      userId: context.userId,
    });
    return organizations.map(toOrganizationResponse);
  },
});

export const POST = route({
  access: "user",
  body: createOrganizationRequestSchema,
  status: HttpStatus.Created,
  handle: async ({ body, context }) => {
    const organization = await composition.organization.create.execute({
      name: body.name,
      ownerUserId: context.userId,
    });
    return toOrganizationResponse(organization);
  },
});
