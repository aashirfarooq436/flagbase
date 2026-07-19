import { composition } from "@flagbase/composition";
import { setFlagEnabledRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";

import { z } from "zod";

import { route } from "@/lib/decorators";
import { toFlagResponse } from "@/lib/presenters/flag.presenter";

const paramsSchema = z.object({ flagId: z.string().min(1) });

export const GET = route({
  access: "organization",
  action: "read",
  subject: "Flag",
  params: paramsSchema,
  handle: async ({ params, context }) => {
    const flag = await composition.flag.get.execute({
      organizationId: context.organizationId,
      flagId: params.flagId,
    });
    return toFlagResponse(flag);
  },
});

// PATCH toggles the flag's kill switch (enabled). Targeting rules have their own sub-resource.
export const PATCH = route({
  access: "organization",
  action: "update",
  subject: "Flag",
  params: paramsSchema,
  body: setFlagEnabledRequestSchema,
  handle: async ({ body, params, context }) => {
    const flag = await composition.flag.setEnabled.execute({
      organizationId: context.organizationId,
      flagId: params.flagId,
      enabled: body.enabled,
    });
    return toFlagResponse(flag);
  },
});

export const DELETE = route({
  access: "organization",
  action: "delete",
  subject: "Flag",
  params: paramsSchema,
  status: HttpStatus.NoContent,
  handle: async ({ params, context }) => {
    await composition.flag.delete.execute({
      organizationId: context.organizationId,
      flagId: params.flagId,
    });
  },
});
