import type { QueryClient } from "@tanstack/react-query";

import { authKeys, organizationKeys } from "./keys";

/**
 * The invalidation strategy — named, per-domain helpers a mutation calls in its `onSuccess`
 * so "what to refetch after this write" lives in one place, not scattered across hooks. A
 * mutation says `invalidate.organizations(qc)`, not a raw key.
 */
export const invalidate = {
  me: (queryClient: QueryClient): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: authKeys.me }),

  organizations: (queryClient: QueryClient): Promise<void> =>
    queryClient.invalidateQueries({ queryKey: organizationKeys.all }),

  /** After sign-out: everything the previous user could see is now stale. */
  all: (queryClient: QueryClient): Promise<void> =>
    queryClient.invalidateQueries(),
};
