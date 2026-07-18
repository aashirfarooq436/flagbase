import { composition } from "@flagbase/composition";
import { evaluateFlagRequestSchema } from "@flagbase/contracts";
import { z } from "zod";

import { toEvaluateFlagResponse } from "@/lib/presenters/flag.presenter";
import { route } from "@/lib/decorators";

const paramsSchema = z.object({ flagId: z.string().min(1) });

// The dashboard's "test this rule" preview — evaluate the flag against a supplied context.
export const POST = route({
  access: "organization",
  action: "read",
  subject: "Flag",
  params: paramsSchema,
  body: evaluateFlagRequestSchema,
  handle: async ({ body, params, context }) => {
    const value = await composition.flag.evaluate.execute({
      organizationId: context.organizationId,
      flagId: params.flagId,
      context: body.context,
    });
    return toEvaluateFlagResponse(value);
  },
});
