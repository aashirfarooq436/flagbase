import { z } from "zod";

/** A member's role on the wire (the full set, as it appears in responses). */
export type RoleDto = "owner" | "admin" | "member";

/**
 * Roles that may be *assigned* via an invite or a role change. Owner is deliberately
 * excluded — ownership is transferred, not assigned — so a request to grant it is rejected
 * at the edge with a clean 400, and the use-case's ForbiddenError backstops it.
 */
export const assignableRoleSchema = z.enum(["admin", "member"]);
export type AssignableRole = z.infer<typeof assignableRoleSchema>;
