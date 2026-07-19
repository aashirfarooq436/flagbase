import { ValidationError } from "../../shared/errors";
import { bucketOf } from "./bucketing";

/**
 * What share of subjects a flag is rolled out to, as a whole percentage.
 *
 * A value object: it has no identity, and two instances holding the same number are
 * interchangeable. Its invariant lives in the constructor, so a RolloutPercentage
 * holding 150 cannot exist anywhere in the system.
 */
export class RolloutPercentage {
  readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new ValidationError(
        `Rollout percentage must be a whole number, received ${value}`,
      );
    }

    if (value < 0 || value > 100) {
      throw new ValidationError(
        `Rollout percentage must be between 0 and 100, received ${value}`,
      );
    }

    this.value = value;
  }

  /**
   * Whether this subject falls inside the rollout for this flag.
   *
   * Deterministic: the same subject and flag always produce the same answer, in
   * every process, forever. See bucketing.ts.
   *
   * The comparison is `<`, which is what makes the edges exact: buckets run 0..99,
   * so 0 includes nobody and 100 includes everybody.
   */
  includes(subjectKey: string, flagKey: string): boolean {
    return bucketOf(subjectKey, flagKey) < this.value;
  }

  equals(other: RolloutPercentage): boolean {
    return other.value === this.value;
  }

  static none(): RolloutPercentage {
    return new RolloutPercentage(0);
  }

  static full(): RolloutPercentage {
    return new RolloutPercentage(100);
  }
}
