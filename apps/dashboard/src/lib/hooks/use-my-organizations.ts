"use client";

import { useQuery } from "@tanstack/react-query";

import { organizationKeys } from "../query";
import { useApi } from "./use-api";

/** The organizations the current user belongs to (backs the org switcher / onboarding). */
export function useMyOrganizations() {
  const api = useApi();
  return useQuery({
    queryKey: organizationKeys.mine,
    queryFn: () => api.organization.listMine(),
  });
}
