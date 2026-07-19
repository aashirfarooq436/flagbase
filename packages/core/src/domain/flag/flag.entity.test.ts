import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { Flag } from "./flag.entity";
import { FlagKey } from "./flag-key.vo";
import { RolloutPercentage } from "./rollout-percentage.vo";
import { UserIdListRule } from "./targeting-rule";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const LATER = new Date("2026-07-17T01:00:00.000Z");

function makeFlag(overrides?: {
  description?: string;
  defaultValue?: boolean;
}): Flag {
  return Flag.create({
    id: "flag-1",
    projectId: "project-1",
    key: new FlagKey("dark-mode"),
    description: overrides?.description ?? "",
    defaultValue: overrides?.defaultValue,
    now: NOW,
  });
}

describe("Flag", () => {
  describe("create", () => {
    it("ships dark — disabled, no rules, 0% rollout", () => {
      const flag = makeFlag();

      expect(flag.enabled).toBe(false);
      expect(flag.targetingRules).toHaveLength(0);
      expect(flag.rolloutPercentage.value).toBe(0);
    });

    it("defaults defaultValue to false", () => {
      expect(makeFlag().defaultValue).toBe(false);
    });

    it("honors an explicit defaultValue", () => {
      expect(makeFlag({ defaultValue: true }).defaultValue).toBe(true);
    });

    it("stamps createdAt and updatedAt with the supplied time", () => {
      const flag = makeFlag();
      expect(flag.createdAt).toBe(NOW);
      expect(flag.updatedAt).toBe(NOW);
    });

    it("rejects a description beyond the length limit", () => {
      expect(() => makeFlag({ description: "x".repeat(501) })).toThrow(
        ValidationError,
      );
    });
  });

  describe("evaluate — a freshly created flag", () => {
    it("returns false because it is disabled", () => {
      expect(makeFlag().evaluate({ key: "user-1" })).toBe(false);
    });
  });

  describe("evaluate — the disabled kill switch", () => {
    it("overrides a targeting rule that names the user explicitly", () => {
      // The headline promise: turning a flag off turns it off for EVERYONE, including
      // a user hard-targeted to true. Only holds because enabled is checked first.
      const flag = makeFlag();
      flag.updateRules(
        [new UserIdListRule(["user-1"], true)],
        RolloutPercentage.full(),
        NOW,
      );
      // flag is still disabled

      expect(flag.evaluate({ key: "user-1" })).toBe(false);
    });

    it("overrides a 100% rollout", () => {
      const flag = makeFlag();
      flag.updateRules([], RolloutPercentage.full(), NOW);

      expect(flag.evaluate({ key: "anyone" })).toBe(false);
    });

    it("overrides a true default value", () => {
      const flag = makeFlag({ defaultValue: true });

      expect(flag.evaluate({ key: "user-1" })).toBe(false);
    });
  });

  describe("evaluate — when enabled", () => {
    it("returns the matching rule's value ahead of rollout and default", () => {
      const flag = makeFlag({ defaultValue: true });
      flag.updateRules(
        [new UserIdListRule(["user-1"], false)],
        RolloutPercentage.full(), // would say true
        NOW,
      );
      flag.enable(NOW);

      // Rule wins over both the 100% rollout and the true default.
      expect(flag.evaluate({ key: "user-1" })).toBe(false);
    });

    it("uses the first matching rule when several match", () => {
      const flag = makeFlag();
      flag.updateRules(
        [
          new UserIdListRule(["user-1"], true),
          new UserIdListRule(["user-1"], false),
        ],
        RolloutPercentage.none(),
        NOW,
      );
      flag.enable(NOW);

      expect(flag.evaluate({ key: "user-1" })).toBe(true);
    });

    it("falls through to rollout when no rule matches", () => {
      const flag = makeFlag({ defaultValue: false });
      flag.updateRules(
        [new UserIdListRule(["someone-else"], true)],
        RolloutPercentage.full(),
        NOW,
      );
      flag.enable(NOW);

      // No rule matches user-1, rollout is 100% ⇒ true.
      expect(flag.evaluate({ key: "user-1" })).toBe(true);
    });

    it("falls through to the default value when no rule matches and rollout excludes the subject", () => {
      const flag = makeFlag({ defaultValue: true });
      flag.enable(NOW); // no rules, 0% rollout

      expect(flag.evaluate({ key: "user-1" })).toBe(true);
    });

    it("is deterministic for the same subject", () => {
      const flag = makeFlag();
      flag.updateRules([], new RolloutPercentage(50), NOW);
      flag.enable(NOW);

      const first = flag.evaluate({ key: "user-42" });
      for (let i = 0; i < 100; i++) {
        expect(flag.evaluate({ key: "user-42" })).toBe(first);
      }
    });
  });

  describe("state transitions", () => {
    it("enable/disable flips enabled and advances updatedAt", () => {
      const flag = makeFlag();

      flag.enable(LATER);
      expect(flag.enabled).toBe(true);
      expect(flag.updatedAt).toBe(LATER);

      flag.disable(LATER);
      expect(flag.enabled).toBe(false);
    });

    it("updateRules replaces rules and rollout and advances updatedAt", () => {
      const flag = makeFlag();
      const rule = new UserIdListRule(["user-1"], true);

      flag.updateRules([rule], new RolloutPercentage(25), LATER);

      expect(flag.targetingRules).toHaveLength(1);
      expect(flag.rolloutPercentage.value).toBe(25);
      expect(flag.updatedAt).toBe(LATER);
    });

    it("does not expose internal mutation of its rules array", () => {
      const flag = makeFlag();
      const rules = [new UserIdListRule(["user-1"], true)];
      flag.updateRules(rules, RolloutPercentage.none(), NOW);

      // Mutating the caller's array must not reach into the flag.
      rules.push(new UserIdListRule(["user-2"], true));
      expect(flag.targetingRules).toHaveLength(1);
    });

    it("changeDescription validates and advances updatedAt", () => {
      const flag = makeFlag();

      flag.changeDescription("now with detail", LATER);
      expect(flag.description).toBe("now with detail");
      expect(flag.updatedAt).toBe(LATER);

      expect(() => flag.changeDescription("x".repeat(501), LATER)).toThrow(
        ValidationError,
      );
    });

    it("keeps key immutable — it is exposed read-only", () => {
      expect(makeFlag().key.value).toBe("dark-mode");
    });
  });
});
