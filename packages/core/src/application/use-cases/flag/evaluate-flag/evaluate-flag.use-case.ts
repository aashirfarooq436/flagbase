import type { EvaluationContext } from "../../../../domain/flag/evaluation-context";
import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import { loadFlagInOrganization } from "../../../shared/tenant-guard";
import type { IUseCase } from "../../use-case";

export type EvaluateFlagInput = {
  organizationId: string;
  flagId: string;
  context: EvaluationContext;
};

/**
 * Evaluates a flag against a supplied context — the dashboard's "test this rule"
 * preview. The evaluation itself is pure domain logic (`Flag.evaluate`); this use-case
 * only loads the flag and enforces the tenant boundary. No clock or id generator: it
 * reads and computes, it does not mutate.
 */
export class EvaluateFlagUseCase implements IUseCase<
  EvaluateFlagInput,
  boolean
> {
  constructor(
    private readonly flagRepository: IFlagRepository,
    private readonly projectRepository: IProjectRepository,
  ) {}

  async execute(input: EvaluateFlagInput): Promise<boolean> {
    const flag = await loadFlagInOrganization(
      input.flagId,
      input.organizationId,
      this.flagRepository,
      this.projectRepository,
    );

    return flag.evaluate(input.context);
  }
}
