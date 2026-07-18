import { composition } from "@flagbase/composition";
import { updateFlagRulesRequestSchema } from "@flagbase/contracts";
import { z } from "zod";

import { toFlagResponse } from "@/lib/presenters/flag.presenter";
import { route } from "@/lib/decorators";

const paramsSchema = z.object({ flagId: z.string().min(1) });

// Replaces the flag's targeting rules + rollout percentage (a full PUT of the rule set).
export const PUT = route({
  access: "organization",
  action: "update",
  subject: "Flag",
  params: paramsSchema,
  body: updateFlagRulesRequestSchema,
  handle: async ({ body, params, context }) => {
    const flag = await composition.flag.updateRules.execute({
      organizationId: context.organizationId,
      flagId: params.flagId,
      targetingRules: body.targetingRules,
      rolloutPercentage: body.rolloutPercentage,
    });
    return toFlagResponse(flag);
  },
});
