import type { Flag } from "../../domain/flag/flag.entity";
import type { IFlagRepository } from "../../domain/flag/flag.repository";
import type { Project } from "../../domain/project/project.entity";
import type { IProjectRepository } from "../../domain/project/project.repository";
import { ForbiddenError, NotFoundError } from "../../shared/errors";

/**
 * The tenant-boundary guards, shared by every use-case that acts on an org-scoped resource.
 *
 * The route's coarse RBAC (CASL) checks the actor's ROLE; these check that the resource
 * actually belongs to the actor's organization. Keeping the check in one place means the
 * boundary rule — and its NotFound-vs-Forbidden distinction — lives in exactly one spot.
 */

/** Loads a project and asserts it belongs to the acting organization. */
export async function loadProjectInOrganization(
  projectId: string,
  organizationId: string,
  projectRepository: IProjectRepository,
): Promise<Project> {
  const project = await projectRepository.findById(projectId);
  if (project === null) {
    throw new NotFoundError(`Project ${projectId} not found`);
  }
  if (project.organizationId !== organizationId) {
    throw new ForbiddenError("Project does not belong to this organization");
  }
  return project;
}

/**
 * Loads a flag and asserts it belongs to the acting organization (flag → project → org).
 *
 * A missing or wrong-org project surfaces as Forbidden, not NotFound: the flag exists, it
 * just isn't the actor's to touch — revealing "this flag's project is in another org" would
 * leak cross-tenant information.
 */
export async function loadFlagInOrganization(
  flagId: string,
  organizationId: string,
  flagRepository: IFlagRepository,
  projectRepository: IProjectRepository,
): Promise<Flag> {
  const flag = await flagRepository.findById(flagId);
  if (flag === null) {
    throw new NotFoundError(`Flag ${flagId} not found`);
  }

  const project = await projectRepository.findById(flag.projectId);
  if (project === null || project.organizationId !== organizationId) {
    throw new ForbiddenError("Flag does not belong to this organization");
  }

  return flag;
}

/**
 * Asserts an already-loaded resource that carries its own `organizationId` belongs to the
 * acting organization (Member, Invitation). `label` names it in the error message.
 */
export function assertResourceInOrganization(
  resource: { readonly organizationId: string },
  organizationId: string,
  label: string,
): void {
  if (resource.organizationId !== organizationId) {
    throw new ForbiddenError(`${label} does not belong to this organization`);
  }
}
