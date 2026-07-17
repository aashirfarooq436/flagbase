import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../../shared/errors";
import type { IUseCase } from "../../use-case";

export type DeleteProjectInput = {
  organizationId: string;
  projectId: string;
};

/**
 * Deletes an empty project.
 *
 * Refuses to delete a project that still has flags — deleting them here would be a
 * multi-document cascade, and silently orphaning them is worse. The caller deletes the
 * flags first. (A cascading delete via the Unit of Work is a plausible later refinement.)
 */
export class DeleteProjectUseCase
  implements IUseCase<DeleteProjectInput, void>
{
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly flagRepository: IFlagRepository,
  ) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    const project = await this.projectRepository.findById(input.projectId);
    if (project === null) {
      throw new NotFoundError(`Project ${input.projectId} not found`);
    }
    if (project.organizationId !== input.organizationId) {
      throw new ForbiddenError("Project does not belong to this organization");
    }

    const flags = await this.flagRepository.findByProjectId(input.projectId);
    if (flags.length > 0) {
      throw new ConflictError(
        "Cannot delete a project that still has flags; delete its flags first",
      );
    }

    await this.projectRepository.delete(input.projectId);
  }
}
