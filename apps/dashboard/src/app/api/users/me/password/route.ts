import { composition } from "@flagbase/composition";
import { changePasswordRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";

import { route } from "@/lib/route";

export const PUT = route({
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
