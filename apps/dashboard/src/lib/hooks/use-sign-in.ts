"use client";

import type { SignInRequest } from "@flagbase/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidate } from "../query";
import { useApi } from "./use-api";

/** Signs in and starts the session; refreshes the cached "me". */
export function useSignIn() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SignInRequest) => api.auth.signIn(body),
    onSuccess: () => invalidate.me(queryClient),
  });
}
