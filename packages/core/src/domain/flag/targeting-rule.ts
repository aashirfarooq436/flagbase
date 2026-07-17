import { ValidationError } from "../../shared/errors";
import type { EvaluationContext } from "./evaluation-context";

/**
 * A single targeting rule: a predicate over an evaluation context plus the value to
 * return when it matches.
 *
 * This interface is the OCP seam. New rule kinds (attribute matching in v2) implement
 * it; they do not add branches to Flag.evaluate(). The engine only ever knows how to
 * ask a rule "do you match?" and "what's your value?".
 */
export interface TargetingRule {
  readonly value: boolean;
  matches(context: EvaluationContext): boolean;
}

/**
 * Matches when the evaluation subject's key appears in an explicit list — "these
 * specific users get the feature." The only rule type in v1.
 */
export class UserIdListRule implements TargetingRule {
  readonly value: boolean;
  private readonly userIds: ReadonlySet<string>;

  constructor(userIds: readonly string[], value: boolean) {
    if (userIds.length === 0) {
      throw new ValidationError(
        "A user-id targeting rule must list at least one user id",
      );
    }

    // A Set for O(1) membership — a rule may hold thousands of ids and is consulted
    // on every evaluation.
    this.userIds = new Set(userIds);
    this.value = value;
  }

  matches(context: EvaluationContext): boolean {
    return this.userIds.has(context.key);
  }

  /** The ids this rule targets, for persistence and for presenting the rule back to the dashboard. */
  targetedUserIds(): string[] {
    return [...this.userIds];
  }
}
