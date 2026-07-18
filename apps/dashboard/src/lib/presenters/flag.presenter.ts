import type {
  EvaluateFlagResponse,
  FlagResponse,
  TargetingRuleResponse,
} from "@flagbase/contracts";
import { type Flag, type TargetingRule, UserIdListRule } from "@flagbase/core";

function toTargetingRuleResponse(rule: TargetingRule): TargetingRuleResponse {
  if (rule instanceof UserIdListRule) {
    return {
      type: "user-id-list",
      userIds: rule.targetedUserIds(),
      value: rule.value,
    };
  }
  // Unreachable in v1 (only one rule type); a guard for when v2 adds rule kinds.
  throw new Error("Unknown targeting rule type");
}

/** Maps a Flag entity to its wire DTO — value objects → primitives, dates → ISO strings. */
export function toFlagResponse(flag: Flag): FlagResponse {
  return {
    id: flag.id,
    projectId: flag.projectId,
    key: flag.key.value,
    description: flag.description,
    enabled: flag.enabled,
    targetingRules: flag.targetingRules.map(toTargetingRuleResponse),
    rolloutPercentage: flag.rolloutPercentage.value,
    defaultValue: flag.defaultValue,
    createdAt: flag.createdAt.toISOString(),
    updatedAt: flag.updatedAt.toISOString(),
  };
}

/** Wraps the boolean evaluation result in its DTO. */
export function toEvaluateFlagResponse(value: boolean): EvaluateFlagResponse {
  return { value };
}
