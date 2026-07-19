"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "./use-api";

/** Ends the session and drops all cached data (nothing the previous user saw is valid now). */
export function useSignOut() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.auth.signOut(),
    // Drop the cache rather than invalidate it — invalidating would refetch every query against
    // the just-cleared session (a burst of 401s). clear() removes them outright.
    onSuccess: () => queryClient.clear(),
  });
}
