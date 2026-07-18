/**
 * What a member is allowed to do within their organization.
 *
 * This file is plain data on purpose. CASL never appears in `core` — the delivery
 * layer (each app's lib/casl) reads this table and builds an Ability from it. That
 * separation is what lets any consumer of core (including the v2 SDK, which has no
 * use for CASL) depend on the domain without dragging an authorization library along.
 */

export enum Role {
  Owner = "owner",
  Admin = "admin",
  Member = "member",
}

export type Permission =
  | "organization:manage"
  | "project:manage"
  | "project:read"
  | "flag:manage"
  | "flag:read"
  | "member:manage"
  | "member:read";

/**
 * Note that `manage` is not listed alongside `read` for the same subject. At the CASL
 * layer `manage` is a wildcard that subsumes every action, so `flag:manage` already
 * implies `flag:read`. Listing both would be redundant, and worse, would invite the
 * two lists to drift.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.Owner]: [
    "organization:manage",
    "project:manage",
    "flag:manage",
    "member:manage",
  ],
  [Role.Admin]: ["project:manage", "flag:manage", "member:read"],
  [Role.Member]: ["project:read", "flag:read"],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
