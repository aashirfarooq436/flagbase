import type { Flag } from "../../../../domain/flag/flag.entity";
import type { IFlagRepository } from "../../../../domain/flag/flag.repository";
import { RolloutPercentage } from "../../../../domain/flag/rollout-percentage.vo";
import {
  type TargetingRule,
  UserIdListRule,
} from "../../../../domain/flag/targeting-rule";
import type { IProjectRepository } from "../../../../domain/project/project.repository";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors";
import type { IClock } from "../../../ports";
import type { IUseCase } from "../../use-case";

/** The wire shape of a targeting rule — primitives, discriminated by `type`. */
export type TargetingRuleInput = {
  type: "user-id-list";
  userIds: string[];
  value: boolean;
};

export type UpdateFlagRulesInput = {
  organizationId: string;
  flagId: string;
  targetingRules: TargetingRuleInput[];
  rolloutPercentage: number;
};

/**
 * Replaces a flag's targeting rules and rollout percentage.
 *
 * Rule DTOs from the input are translated into domain TargetingRule instances here —
 * the reverse of what the persistence mapper does. Value-object construction
 * (RolloutPercentage, UserIdListRule) is where domain validation happens.
 */
export class UpdateFlagRulesUseCase implements IUseCase<
  UpdateFlagRulesInput,
  Flag
> {
  constructor(
    private readonly flagRepository: IFlagRepository,
    private readonly projectRepository: IProjectRepository,
    private readonly clock: IClock,
  ) {}

  async execute(input: UpdateFlagRulesInput): Promise<Flag> {
    const flag = await this.flagRepository.findById(input.flagId);
    if (flag === null) {
      throw new NotFoundError(`Flag ${input.flagId} not found`);
    }

    const project = await this.projectRepository.findById(flag.projectId);
    if (project === null || project.organizationId !== input.organizationId) {
      throw new ForbiddenError("Flag does not belong to this organization");
    }

    const rules = input.targetingRules.map(toTargetingRule);
    const rollout = new RolloutPercentage(input.rolloutPercentage);

    flag.updateRules(rules, rollout, this.clock.now());

    await this.flagRepository.save(flag);
    return flag;
  }
}

function toTargetingRule(input: TargetingRuleInput): TargetingRule {
  switch (input.type) {
    case "user-id-list":
      return new UserIdListRule(input.userIds, input.value);
    default:
      throw new ValidationError(
        `Unknown targeting rule type: ${(input as { type: string }).type}`,
      );
  }
}
