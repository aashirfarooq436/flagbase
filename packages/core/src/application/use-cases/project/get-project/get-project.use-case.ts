import type { Project } from "../../../../domain/project/project.entity";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { loadProjectInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

export type GetProjectInput = {
  organizationId: string;
  projectId: string;
};

/** Fetches a single project, verifying it belongs to the actor's organization. */
export class GetProjectUseCase implements IUseCase<GetProjectInput, Project> {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(input: GetProjectInput): Promise<Project> {
    return loadProjectInOrganization(
      input.projectId,
      input.organizationId,
      this.projectRepository,
    );
  }
}
