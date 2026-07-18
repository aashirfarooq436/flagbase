import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { ConflictError } from "../../../../shared/errors";
import { loadProjectInOrganization } from "../../../shared/tenant-guard";
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
export class DeleteProjectUseCase implements IUseCase<
  DeleteProjectInput,
  void
> {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly flagRepository: IFlagRepository,
  ) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    await loadProjectInOrganization(
      input.projectId,
      input.organizationId,
      this.projectRepository,
    );

    const flags = await this.flagRepository.findByProjectId(input.projectId);
    if (flags.length > 0) {
      throw new ConflictError(
        "Cannot delete a project that still has flags; delete its flags first",
      );
    }

    await this.projectRepository.delete(input.projectId);
  }
}
