import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { loadFlagInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

export type DeleteFlagInput = {
  organizationId: string;
  flagId: string;
};

/** Deletes a flag, verifying it belongs to the actor's organization (flag → project → org). */
export class DeleteFlagUseCase implements IUseCase<DeleteFlagInput, void> {
  constructor(
    private readonly flagRepository: IFlagRepository,
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(input: DeleteFlagInput): Promise<void> {
    await loadFlagInOrganization(
      input.flagId,
      input.organizationId,
      this.flagRepository,
      this.projectRepository,
    );

    await this.flagRepository.delete(input.flagId);
  }
}
