import type { Project } from "../../../../domain/project/project.entity";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import type { IUseCase } from "../../use-case";

export type GetProjectInput = {
  organizationId: string;
  projectId: string;
};

/** Fetches a single project, verifying it belongs to the actor's organization. */
export class GetProjectUseCase implements IUseCase<GetProjectInput, Project> {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(input: GetProjectInput): Promise<Project> {
    const project = await this.projectRepository.findById(input.projectId);
    if (project === null) {
      throw new NotFoundError(`Project ${input.projectId} not found`);
    }
    if (project.organizationId !== input.organizationId) {
      throw new ForbiddenError("Project does not belong to this organization");
    }
    return project;
  }
}
