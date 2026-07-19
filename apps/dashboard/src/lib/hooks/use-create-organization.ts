"use client";

import type { CreateOrganizationRequest } from "@flagbase/contracts";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidate } from "../query";
import { useApi } from "./use-api";

/** Creates an organization (the onboarding step); refreshes the user's org list. */
export function useCreateOrganization() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrganizationRequest) =>
      api.organization.create(body),
    onSuccess: () => invalidate.organizations(queryClient),
  });
}
