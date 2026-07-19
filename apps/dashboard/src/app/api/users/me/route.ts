import { composition } from "@flagbase/composition";
import { updateProfileRequestSchema } from "@flagbase/contracts";

import { route } from "@/lib/decorators";
import { toUserResponse } from "@/lib/presenters/user.presenter";

export const GET = route({
  access: "user",
  handle: async ({ context }) => toUserResponse(context.user),
});

export const PATCH = route({
  access: "user",
  body: updateProfileRequestSchema,
  handle: async ({ body, context }) => {
    const user = await composition.user.updateProfile.execute({
      userId: context.userId,
      name: body.name,
    });
    return toUserResponse(user);
  },
});
