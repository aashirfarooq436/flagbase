import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { UserIdListRule } from "./targeting-rule";

describe("UserIdListRule", () => {
  it("matches when the subject key is in the list", () => {
    const rule = new UserIdListRule(["user-1", "user-2"], true);

    expect(rule.matches({ key: "user-1" })).toBe(true);
    expect(rule.matches({ key: "user-2" })).toBe(true);
  });

  it("does not match when the subject key is absent", () => {
    const rule = new UserIdListRule(["user-1"], true);
    expect(rule.matches({ key: "user-99" })).toBe(false);
  });

  it("carries the value it returns on a match", () => {
    expect(new UserIdListRule(["user-1"], true).value).toBe(true);
    expect(new UserIdListRule(["user-1"], false).value).toBe(false);
  });

  it("rejects an empty user list — an empty rule can never match anything", () => {
    expect(() => new UserIdListRule([], true)).toThrow(ValidationError);
  });

  it("reports the ids it targets", () => {
    const rule = new UserIdListRule(["user-1", "user-2", "user-1"], true);
    // De-duplicated via the internal Set.
    expect(rule.targetedUserIds().sort()).toEqual(["user-1", "user-2"]);
  });
});
