import { composition } from "@flagbase/composition";

import { toMemberResponse } from "@/lib/presenters/member.presenter";
import { route } from "@/lib/route";

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
