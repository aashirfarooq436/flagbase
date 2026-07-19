"use client";

import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from "@flagbase/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidate } from "../query";
import { useApi } from "./use-api";

/** Updates the current user's display name; refreshes the cached "me". */
export function useUpdateProfile() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => api.user.updateProfile(body),
    onSuccess: () => invalidate.me(queryClient),
  });
}

/** Changes the password. No cached data depends on it, so nothing is invalidated. */
export function useChangePassword() {
  const api = useApi();
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => api.user.changePassword(body),
  });
}
