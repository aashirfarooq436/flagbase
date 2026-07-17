import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
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
    const flag = await this.flagRepository.findById(input.flagId);
    if (flag === null) {
      throw new NotFoundError(`Flag ${input.flagId} not found`);
    }

    const project = await this.projectRepository.findById(flag.projectId);
    if (project === null || project.organizationId !== input.organizationId) {
      throw new ForbiddenError("Flag does not belong to this organization");
    }

    await this.flagRepository.delete(input.flagId);
  }
}
