"use client";

import { useQuery } from "@tanstack/react-query";

import { authKeys } from "../query";
import { useApi } from "./use-api";

/** The current authenticated user. A 401 (null) means not signed in. */
export function useUser() {
  const api = useApi();
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => api.auth.me(),
  });
}
