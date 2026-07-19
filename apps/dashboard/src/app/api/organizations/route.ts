import { composition } from "@flagbase/composition";
import { createOrganizationRequestSchema } from "@flagbase/contracts";
import { ConflictError, Slug } from "@flagbase/core";
import { HttpStatus } from "@flagbase/shared/http";

import { RESERVED_SLUGS } from "@/lib/constants/routes";
import { route } from "@/lib/decorators";
import { toOrganizationResponse } from "@/lib/presenters/organization.presenter";

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
    // The name's slug becomes the org's URL. Reject one that collides with a reserved root route
    // (the use-case + unique index handle collisions with other orgs).
    if (RESERVED_SLUGS.has(Slug.fromName(body.name).value)) {
      throw new ConflictError("That organization name is reserved");
    }
    const organization = await composition.organization.create.execute({
      name: body.name,
      ownerUserId: context.userId,
    });
    return toOrganizationResponse(organization);
  },
});
