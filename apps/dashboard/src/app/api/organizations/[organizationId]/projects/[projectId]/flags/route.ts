import { composition } from "@flagbase/composition";
import { createFlagRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";

import { z } from "zod";

import { route } from "@/lib/decorators";
import { toFlagResponse } from "@/lib/presenters/flag.presenter";

const paramsSchema = z.object({ projectId: z.string().min(1) });

export const GET = route({
  access: "organization",
  action: "read",
  subject: "Flag",
  params: paramsSchema,
  handle: async ({ params, context }) => {
    const flags = await composition.flag.list.execute({
      organizationId: context.organizationId,
      projectId: params.projectId,
    });
    return flags.map(toFlagResponse);
  },
});

export const POST = route({
  access: "organization",
  action: "create",
  subject: "Flag",
  params: paramsSchema,
  body: createFlagRequestSchema,
  status: HttpStatus.Created,
  handle: async ({ body, params, context }) => {
    const flag = await composition.flag.create.execute({
      organizationId: context.organizationId,
      projectId: params.projectId,
      key: body.key,
      description: body.description,
      defaultValue: body.defaultValue,
    });
    return toFlagResponse(flag);
  },
});
