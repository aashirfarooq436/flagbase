import type { Flag } from "../../domain/flag/flag.entity";
import type { IFlagRepository } from "../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../domain/project/project.repository";
import { ForbiddenError, NotFoundError } from "../../shared/errors";
import type { IUseCase } from "../use-case";

export type ListFlagsInput = {
  organizationId: string;
  projectId: string;
};

/** Lists a project's flags, after verifying the project belongs to the actor's organization. */
export class ListFlagsUseCase implements IUseCase<ListFlagsInput, Flag[]> {
  constructor(
    private readonly flagRepository: IFlagRepository,
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(input: ListFlagsInput): Promise<Flag[]> {
    const project = await this.projectRepository.findById(input.projectId);
    if (project === null) {
      throw new NotFoundError(`Project ${input.projectId} not found`);
    }
    if (project.organizationId !== input.organizationId) {
      throw new ForbiddenError("Project does not belong to this organization");
    }

    return this.flagRepository.findByProjectId(input.projectId);
  }
}
