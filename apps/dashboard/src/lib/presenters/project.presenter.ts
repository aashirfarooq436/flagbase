import type { ProjectResponse } from "@flagbase/contracts";
import type { Project } from "@flagbase/core";

/** Maps a Project entity to its wire DTO. */
export function toProjectResponse(project: Project): ProjectResponse {
  return {
    id: project.id,
    organizationId: project.organizationId,
    name: project.name,
    createdAt: project.createdAt.toISOString(),
  };
}
