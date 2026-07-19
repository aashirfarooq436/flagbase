import type { RoleDto } from "../../shared/role";

export type InvitationStatusDto =
  | "pending"
  | "accepted"
  | "revoked"
  | "rejected";

/**
 * An invitation on the wire. Never includes the token or its hash — those are secrets, and
 * the raw token exists only in the email.
 */
export type InvitationResponse = {
  id: string;
  organizationId: string;
  email: string;
  role: RoleDto;
  status: InvitationStatusDto;
  expiresAt: string;
  createdAt: string;
};
