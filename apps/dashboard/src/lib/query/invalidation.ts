import type { QueryClient } from "@tanstack/react-query";

import {
  authKeys,
  flagKeys,
  invitationKeys,
  memberKeys,
  organizationKeys,
  projectKeys,
} from "./keys";

/**
 * The invalidation strategy — named, per-domain helpers a mutation calls in its `onSuccess`
 * so "what to refetch after this write" lives in one place, not scattered across hooks. A
 * mutation says `invalidate.members(qc, orgId)`, not a raw key.
 *
 * Because the keys are hierarchical, invalidating a list key also refetches the details under
 * it (renaming a project via `invalidate.projects` refreshes both the list and that project).
 */
export const invalidate = {
  me: (queryClient: QueryClient): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: authKeys.me }),

  organizations: (queryClient: QueryClient): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: organizationKeys.all }),

  members: (queryClient: QueryClient, organizationId: string): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: memberKeys.all(organizationId) }),

  invitations: (
    queryClient: QueryClient,
    organizationId: string,
  ): Promise<void> =>
    queryClient.invalidateQueries({
      queryKey: invitationKeys.all(organizationId),
    }),

  projects: (queryClient: QueryClient, organizationId: string): Promise<void> =>
    queryClient.invalidateQueries({
      queryKey: projectKeys.all(organizationId),
    }),

  flags: (
    queryClient: QueryClient,
    organizationId: string,
    projectId: string,
  ): Promise<void> =>
    queryClient.invalidateQueries({
      queryKey: flagKeys.all(organizationId, projectId),
    }),

  /** After sign-out: everything the previous user could see is now stale. */
  all: (queryClient: QueryClient): Promise<void> =>
    queryClient.invalidateQueries(),
};
