import type { Project } from "../../../../domain/project/project.entity";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { loadProjectInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

export type RenameProjectInput = {
  organizationId: string;
  projectId: string;
  name: string;
};

/** Renames a project, verifying it belongs to the actor's organization. */
export class RenameProjectUseCase implements IUseCase<
  RenameProjectInput,
  Project
> {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(input: RenameProjectInput): Promise<Project> {
    const project = await loadProjectInOrganization(
      input.projectId,
      input.organizationId,
      this.projectRepository,
    );

    project.rename(input.name);
    await this.projectRepository.save(project);
    return project;
  }
}
