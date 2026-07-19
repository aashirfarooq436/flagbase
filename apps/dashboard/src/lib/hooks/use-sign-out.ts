"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidate } from "../query";
import { useApi } from "./use-api";

/** Ends the session and clears every cached query (nothing the old user saw is valid now). */
export function useSignOut() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.auth.signOut(),
    onSuccess: () => invalidate.all(queryClient),
  });
}
