import { composition } from "@flagbase/composition";
import { signInRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";

import { sessionManager } from "@/lib/auth/session-manager";
import { route } from "@/lib/decorators";
import { toUserResponse } from "@/lib/presenters/user.presenter";

export const POST = route({
  access: "public",
  body: signInRequestSchema,
  status: HttpStatus.Ok,
  handle: async ({ body }) => {
    const user = await composition.user.signIn.execute(body);
    await sessionManager.issue(user);
    return toUserResponse(user);
  },
});
