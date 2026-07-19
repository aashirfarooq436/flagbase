"use client";

import type { ChangeMemberRoleRequest } from "@flagbase/contracts";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidate, memberKeys } from "../query";
import { useApi } from "./use-api";

/** The organization's members. */
export function useMembers(organizationId: string) {
  const api = useApi();
  return useQuery({
    queryKey: memberKeys.all(organizationId),
    queryFn: () => api.member.list(organizationId),
  });
}

/** Changes a member's role; refreshes the roster. */
export function useChangeMemberRole(organizationId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      memberId: string;
      body: ChangeMemberRoleRequest;
    }) =>
      api.member.changeRole(organizationId, variables.memberId, variables.body),
    onSuccess: () => invalidate.members(queryClient, organizationId),
  });
}

/** Removes a member; refreshes the roster. */
export function useRemoveMember(organizationId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.member.remove(organizationId, memberId),
    onSuccess: () => invalidate.members(queryClient, organizationId),
  });
}
