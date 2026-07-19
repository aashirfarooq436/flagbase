"use client";

import type {
  InvitationTokenRequest,
  InviteMemberRequest,
} from "@flagbase/contracts";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidate, invitationKeys } from "../query";
import { useApi } from "./use-api";

/** The organization's invitations (pending + historical). */
export function useInvitations(organizationId: string) {
  const api = useApi();
  return useQuery({
    queryKey: invitationKeys.all(organizationId),
    queryFn: () => api.invitation.list(organizationId),
  });
}

/** Invites someone by email; refreshes the invitation list. */
export function useInviteMember(organizationId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteMemberRequest) =>
      api.invitation.invite(organizationId, body),
    onSuccess: () => invalidate.invitations(queryClient, organizationId),
  });
}

/** Revokes a pending invitation; refreshes the invitation list. */
export function useRevokeInvitation(organizationId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      api.invitation.revoke(organizationId, invitationId),
    onSuccess: () => invalidate.invitations(queryClient, organizationId),
  });
}

/**
 * The invitee accepts (token from their email). They gain a membership, so refresh their org
 * list. Not org-scoped — the invitee isn't a member of the org yet.
 */
export function useAcceptInvitation() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InvitationTokenRequest) => api.invitation.accept(body),
    onSuccess: () => invalidate.organizations(queryClient),
  });
}

/** The invitee declines. Nothing of theirs is cached, so nothing to invalidate. */
export function useRejectInvitation() {
  const api = useApi();
  return useMutation({
    mutationFn: (body: InvitationTokenRequest) => api.invitation.reject(body),
  });
}
