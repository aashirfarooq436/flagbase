import type { Project } from "../../../../domain/project/project.entity";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
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
    const project = await this.projectRepository.findById(input.projectId);
    if (project === null) {
      throw new NotFoundError(`Project ${input.projectId} not found`);
    }
    if (project.organizationId !== input.organizationId) {
      throw new ForbiddenError("Project does not belong to this organization");
    }

    project.rename(input.name);
    await this.projectRepository.save(project);
    return project;
  }
}
