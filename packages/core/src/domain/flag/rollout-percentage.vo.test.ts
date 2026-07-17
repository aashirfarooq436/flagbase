import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { RolloutPercentage } from "./rollout-percentage.vo";

function subjects(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `user-${i}`);
}

describe("RolloutPercentage", () => {
  describe("construction", () => {
    it("accepts whole numbers from 0 to 100", () => {
      for (const value of [0, 1, 50, 99, 100]) {
        expect(new RolloutPercentage(value).value).toBe(value);
      }
    });

    it("rejects values outside 0..100", () => {
      for (const value of [-1, 101, 1_000, -0.5]) {
        expect(() => new RolloutPercentage(value)).toThrow(ValidationError);
      }
    });

    it("rejects fractional percentages", () => {
      expect(() => new RolloutPercentage(50.5)).toThrow(ValidationError);
    });

    it("rejects NaN and Infinity", () => {
      expect(() => new RolloutPercentage(Number.NaN)).toThrow(ValidationError);
      expect(() => new RolloutPercentage(Number.POSITIVE_INFINITY)).toThrow(
        ValidationError,
      );
    });

    it("reports the offending value in the message", () => {
      expect(() => new RolloutPercentage(150)).toThrow(/150/);
    });
  });

  describe("edges", () => {
    it("includes nobody at 0", () => {
      const rollout = RolloutPercentage.none();

      for (const subject of subjects(1_000)) {
        expect(rollout.includes(subject, "dark-mode")).toBe(false);
      }
    });

    it("includes everybody at 100", () => {
      const rollout = RolloutPercentage.full();

      for (const subject of subjects(1_000)) {
        expect(rollout.includes(subject, "dark-mode")).toBe(true);
      }
    });
  });

  describe("includes", () => {
    it("is deterministic for a given subject and flag", () => {
      const rollout = new RolloutPercentage(50);
      const first = rollout.includes("user-42", "dark-mode");

      for (let i = 0; i < 1_000; i++) {
        expect(rollout.includes("user-42", "dark-mode")).toBe(first);
      }
    });

    it("includes roughly the stated percentage of subjects", () => {
      const sample = subjects(50_000);

      for (const percentage of [10, 25, 50, 75, 90]) {
        const rollout = new RolloutPercentage(percentage);
        const included = sample.filter((subject) =>
          rollout.includes(subject, "dark-mode"),
        ).length;

        const actual = (included / sample.length) * 100;
        expect(
          Math.abs(actual - percentage),
          `${percentage}% rollout reached ${actual.toFixed(2)}% of subjects`,
        ).toBeLessThan(1);
      }
    });

    it("is monotonic — widening a rollout never drops an existing user", () => {
      // The property that makes a gradual rollout safe: going 10% → 20% → 30% only
      // ever adds users. If this broke, widening a rollout would revoke the feature
      // from someone who already had it.
      const sample = subjects(2_000);

      for (const subject of sample) {
        let wasIncluded = false;

        for (let percentage = 0; percentage <= 100; percentage++) {
          const isIncluded = new RolloutPercentage(percentage).includes(
            subject,
            "dark-mode",
          );

          if (wasIncluded) {
            expect(
              isIncluded,
              `${subject} was dropped when the rollout widened to ${percentage}%`,
            ).toBe(true);
          }

          wasIncluded = isIncluded;
        }
      }
    });
  });

  describe("equals", () => {
    it("treats instances holding the same value as equal", () => {
      expect(new RolloutPercentage(50).equals(new RolloutPercentage(50))).toBe(
        true,
      );
    });

    it("treats instances holding different values as unequal", () => {
      expect(new RolloutPercentage(50).equals(new RolloutPercentage(51))).toBe(
        false,
      );
    });
  });
});
