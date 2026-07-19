"use client";

import type { RoleDto } from "@flagbase/contracts";

import { useMembers } from "./use-members";
import { useUser } from "./use-user";

/**
 * The current user's role within an organization, derived by matching the session user against
 * the member roster (any member may read it). `undefined` while loading or if not a member.
 * Used to gate role-restricted UI — the API is the authoritative enforcement.
 */
export function useMyRole(organizationId: string): RoleDto | undefined {
  const { data: user } = useUser();
  const { data: members } = useMembers(organizationId);
  return members?.find((member) => member.userId === user?.id)?.role;
}
