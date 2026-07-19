"use client";

import type { RenameOrganizationRequest } from "@flagbase/contracts";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidate, organizationKeys } from "../query";
import { useApi } from "./use-api";

/** A single organization by id. */
export function useOrganization(organizationId: string) {
  const api = useApi();
  return useQuery({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: () => api.organization.getById(organizationId),
  });
}

/** Renames an organization; refreshes the org list + that org's detail. */
export function useRenameOrganization(organizationId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RenameOrganizationRequest) =>
      api.organization.rename(organizationId, body),
    onSuccess: () => invalidate.organizations(queryClient),
  });
}
