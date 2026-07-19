import type { RoleDto } from "../../shared/role";

/**
 * A membership on the wire. Carries `userId` — enriching it with the user's name/email is a
 * delivery-layer join, not part of this DTO.
 */
export type MemberResponse = {
  id: string;
  organizationId: string;
  userId: string;
  role: RoleDto;
  createdAt: string;
};
