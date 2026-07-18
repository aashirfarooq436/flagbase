import { composition } from "@flagbase/composition";
import { changeMemberRoleRequestSchema } from "@flagbase/contracts";
import { type Role } from "@flagbase/core";
import { HttpStatus } from "@flagbase/shared/http";
import { z } from "zod";

import { toMemberResponse } from "@/lib/presenters/member.presenter";
import { route } from "@/lib/decorators";

const paramsSchema = z.object({ memberId: z.string().min(1) });

export const PATCH = route({
  access: "organization",
  action: "update",
  subject: "Member",
  params: paramsSchema,
  body: changeMemberRoleRequestSchema,
  handle: async ({ body, params, context }) => {
    const member = await composition.member.changeRole.execute({
      organizationId: context.organizationId,
      memberId: params.memberId,
      newRole: body.role as Role,
    });
    return toMemberResponse(member);
  },
});

export const DELETE = route({
  access: "organization",
  action: "delete",
  subject: "Member",
  params: paramsSchema,
  status: HttpStatus.NoContent,
  handle: async ({ params, context }) => {
    await composition.member.remove.execute({
      organizationId: context.organizationId,
      memberId: params.memberId,
    });
  },
});
