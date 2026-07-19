import { composition } from "@flagbase/composition";

import { route } from "@/lib/decorators";
import { toMemberResponse } from "@/lib/presenters/member.presenter";

export const GET = route({
  access: "organization",
  action: "read",
  subject: "Member",
  handle: async ({ context }) => {
    const members = await composition.member.list.execute({
      organizationId: context.organizationId,
    });
    return members.map(toMemberResponse);
  },
});
