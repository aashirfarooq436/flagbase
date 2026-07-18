import { composition } from "@flagbase/composition";
import { invitationTokenRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";

import { toMemberResponse } from "@/lib/presenters/member.presenter";
import { route } from "@/lib/route";

// The invitee acts with the raw token — they are not a member yet, so this is `user`-scoped,
// not organization-scoped.
export const POST = route({
  access: "user",
  body: invitationTokenRequestSchema,
  status: HttpStatus.Created,
  handle: async ({ body, context }) => {
    const member = await composition.invitation.accept.execute({
      token: body.token,
      acceptingUserId: context.userId,
    });
    return toMemberResponse(member);
  },
});
