import { composition } from "@flagbase/composition";
import { invitationTokenRequestSchema } from "@flagbase/contracts";

import { route } from "@/lib/decorators";
import { toInvitationResponse } from "@/lib/presenters/invitation.presenter";

export const POST = route({
  access: "user",
  body: invitationTokenRequestSchema,
  handle: async ({ body }) => {
    const invitation = await composition.invitation.reject.execute({
      token: body.token,
    });
    return toInvitationResponse(invitation);
  },
});
