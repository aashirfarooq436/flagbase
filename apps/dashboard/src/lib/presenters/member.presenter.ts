import type { MemberResponse, RoleDto } from "@flagbase/contracts";
import type { Member } from "@flagbase/core";

/** Maps a Member entity to its wire DTO. Enriching with the user's name/email is a route-level join. */
export function toMemberResponse(member: Member): MemberResponse {
  return {
    id: member.id,
    organizationId: member.organizationId,
    userId: member.userId,
    role: member.role as RoleDto,
    createdAt: member.createdAt.toISOString(),
  };
}
