import type {
  InvitationResponse,
  InvitationStatusDto,
  RoleDto,
} from "@flagbase/contracts";
import type { Invitation } from "@flagbase/core";

/** Maps an Invitation entity to its wire DTO — never the token or its hash (both secret). */
export function toInvitationResponse(
  invitation: Invitation,
): InvitationResponse {
  return {
    id: invitation.id,
    organizationId: invitation.organizationId,
    email: invitation.email.value,
    role: invitation.role as RoleDto,
    status: invitation.status as InvitationStatusDto,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}
