"use client";

import type {
  CreateFlagRequest,
  EvaluateFlagRequest,
  SetFlagEnabledRequest,
  UpdateFlagRulesRequest,
} from "@flagbase/contracts";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { flagKeys, invalidate } from "../query";
import { useApi } from "./use-api";

/** The project's flags. */
export function useFlags(organizationId: string, projectId: string) {
  const api = useApi();
  return useQuery({
    queryKey: flagKeys.all(organizationId, projectId),
    queryFn: () => api.flag.list(organizationId, projectId),
  });
}

/** A single flag by id. */
export function useFlag(
  organizationId: string,
  projectId: string,
  flagId: string,
) {
  const api = useApi();
  return useQuery({
    queryKey: flagKeys.detail(organizationId, projectId, flagId),
    queryFn: () => api.flag.getById(organizationId, projectId, flagId),
  });
}

/** Creates a flag; refreshes the flag list. */
export function useCreateFlag(organizationId: string, projectId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFlagRequest) =>
      api.flag.create(organizationId, projectId, body),
    onSuccess: () => invalidate.flags(queryClient, organizationId, projectId),
  });
}

/** Flips a flag's kill switch (`enabled`); refreshes the list + that flag. */
export function useSetFlagEnabled(organizationId: string, projectId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { flagId: string; body: SetFlagEnabledRequest }) =>
      api.flag.setEnabled(
        organizationId,
        projectId,
        variables.flagId,
        variables.body,
      ),
    onSuccess: () => invalidate.flags(queryClient, organizationId, projectId),
  });
}

/** Replaces a flag's targeting rules + rollout; refreshes the list + that flag. */
export function useUpdateFlagRules(organizationId: string, projectId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { flagId: string; body: UpdateFlagRulesRequest }) =>
      api.flag.updateRules(
        organizationId,
        projectId,
        variables.flagId,
        variables.body,
      ),
    onSuccess: () => invalidate.flags(queryClient, organizationId, projectId),
  });
}

/**
 * Server-side "test this rule" preview. A command that returns a value — no cache to update,
 * so it's a mutation with no invalidation.
 */
export function useEvaluateFlag(
  organizationId: string,
  projectId: string,
  flagId: string,
) {
  const api = useApi();
  return useMutation({
    mutationFn: (body: EvaluateFlagRequest) =>
      api.flag.evaluate(organizationId, projectId, flagId, body),
  });
}

/** Deletes a flag; refreshes the flag list. */
export function useDeleteFlag(organizationId: string, projectId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (flagId: string) =>
      api.flag.remove(organizationId, projectId, flagId),
    onSuccess: () => invalidate.flags(queryClient, organizationId, projectId),
  });
}
