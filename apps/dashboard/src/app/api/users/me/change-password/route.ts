import { composition } from "@flagbase/composition";
import { changePasswordRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";

import { route } from "@/lib/decorators";

// A command, not a resource update: non-idempotent (the current password stops matching after
// the first call) and precondition-carrying — so POST to a verb, like the other commands.
export const POST = route({
  access: "user",
  body: changePasswordRequestSchema,
  status: HttpStatus.NoContent,
  handle: async ({ body, context }) => {
    await composition.user.changePassword.execute({
      userId: context.userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
  },
});
