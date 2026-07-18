import { composition } from "@flagbase/composition";
import { inviteMemberRequestSchema } from "@flagbase/contracts";
import { type Role } from "@flagbase/core";
import { HttpStatus } from "@flagbase/shared/http";

import { toInvitationResponse } from "@/lib/presenters/invitation.presenter";
import { route } from "@/lib/route";

export const GET = route({
  access: "organization",
  action: "read",
  subject: "Member",
  handle: async ({ context }) => {
    const invitations = await composition.invitation.listPending.execute({
      organizationId: context.organizationId,
    });
    return invitations.map(toInvitationResponse);
  },
});

export const POST = route({
  access: "organization",
  action: "create",
  subject: "Member",
  body: inviteMemberRequestSchema,
  status: HttpStatus.Created,
  handle: async ({ body, context }) => {
    const invitation = await composition.invitation.invite.execute({
      organizationId: context.organizationId,
      inviterUserId: context.userId,
      email: body.email,
      role: body.role as Role,
    });
    return toInvitationResponse(invitation);
  },
});
