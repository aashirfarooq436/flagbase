"use client";

import type { SignUpRequest } from "@flagbase/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidate } from "../query";
import { useApi } from "./use-api";

/** Registers a new user and starts their session; refreshes the cached "me". */
export function useSignUp() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SignUpRequest) => api.auth.signUp(body),
    onSuccess: () => invalidate.me(queryClient),
  });
}
