import { composition } from "@flagbase/composition";
import { invitationTokenRequestSchema } from "@flagbase/contracts";

import { toInvitationResponse } from "@/lib/presenters/invitation.presenter";
import { route } from "@/lib/route";

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
