import type { Project } from "../../../../domain/project/project.entity";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import type { IUseCase } from "../../use-case";

export type ListProjectsInput = {
  organizationId: string;
};

/** Lists an organization's projects. */
export class ListProjectsUseCase
  implements IUseCase<ListProjectsInput, Project[]>
{
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(input: ListProjectsInput): Promise<Project[]> {
    return this.projectRepository.findByOrganizationId(input.organizationId);
  }
}
