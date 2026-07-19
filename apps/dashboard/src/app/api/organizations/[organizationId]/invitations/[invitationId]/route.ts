import { composition } from "@flagbase/composition";
import { HttpStatus } from "@flagbase/shared/http";

import { z } from "zod";

import { route } from "@/lib/decorators";

const paramsSchema = z.object({ invitationId: z.string().min(1) });

export const DELETE = route({
  access: "organization",
  action: "delete",
  subject: "Member",
  params: paramsSchema,
  status: HttpStatus.NoContent,
  handle: async ({ params, context }) => {
    await composition.invitation.revoke.execute({
      organizationId: context.organizationId,
      invitationId: params.invitationId,
    });
  },
});
