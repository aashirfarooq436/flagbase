"use client";

import type {
  CreateProjectRequest,
  RenameProjectRequest,
} from "@flagbase/contracts";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidate, projectKeys } from "../query";
import { useApi } from "./use-api";

/** The organization's projects. */
export function useProjects(organizationId: string) {
  const api = useApi();
  return useQuery({
    queryKey: projectKeys.all(organizationId),
    queryFn: () => api.project.list(organizationId),
  });
}

/** A single project by id. */
export function useProject(organizationId: string, projectId: string) {
  const api = useApi();
  return useQuery({
    queryKey: projectKeys.detail(organizationId, projectId),
    queryFn: () => api.project.getById(organizationId, projectId),
  });
}

/** Creates a project; refreshes the project list. */
export function useCreateProject(organizationId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectRequest) =>
      api.project.create(organizationId, body),
    onSuccess: () => invalidate.projects(queryClient, organizationId),
  });
}

/** Renames a project; refreshes the list + that project's detail. */
export function useRenameProject(organizationId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      projectId: string;
      body: RenameProjectRequest;
    }) =>
      api.project.rename(organizationId, variables.projectId, variables.body),
    onSuccess: () => invalidate.projects(queryClient, organizationId),
  });
}

/** Deletes a project; refreshes the project list. */
export function useDeleteProject(organizationId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      api.project.remove(organizationId, projectId),
    onSuccess: () => invalidate.projects(queryClient, organizationId),
  });
}
