import type { Flag } from "../../../../domain/flag/flag.entity";
import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { loadProjectInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

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
    await loadProjectInOrganization(
      input.projectId,
      input.organizationId,
      this.projectRepository,
    );

    return this.flagRepository.findByProjectId(input.projectId);
  }
}
