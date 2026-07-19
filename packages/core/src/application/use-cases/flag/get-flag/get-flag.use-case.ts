import type { Flag } from "../../../../domain/flag/flag.entity";
import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { loadFlagInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

export type GetFlagInput = {
  organizationId: string;
  flagId: string;
};

/** Fetches a single flag, verifying it belongs to the actor's organization (flag → project → org). */
export class GetFlagUseCase implements IUseCase<GetFlagInput, Flag> {
  constructor(
    private readonly flagRepository: IFlagRepository,
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(input: GetFlagInput): Promise<Flag> {
    return loadFlagInOrganization(
      input.flagId,
      input.organizationId,
      this.flagRepository,
      this.projectRepository,
    );
  }
}
