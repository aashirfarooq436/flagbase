import type { TargetingRuleDto } from "./request";

/**
 * A flag on the wire — flattened and JSON-safe: value objects become primitives
 * (`FlagKey` → string, `RolloutPercentage` → number) and dates become ISO strings. The
 * presenter in the delivery layer builds this from a `Flag` entity.
 */
export type FlagResponse = {
  id: string;
  projectId: string;
  key: string;
  description: string;
  enabled: boolean;
  targetingRules: TargetingRuleDto[];
  rolloutPercentage: number;
  defaultValue: boolean;
  createdAt: string;
  updatedAt: string;
};

/** The result of the "test this rule" preview. Wrapped in an object so the shape can grow. */
export type EvaluateFlagResponse = {
  value: boolean;
};
