import { describe, expect, it } from "vitest";

import {
  createFlagRequestSchema,
  evaluateFlagRequestSchema,
  targetingRuleSchema,
  updateFlagRulesRequestSchema,
} from "./request";

describe("createFlagRequestSchema", () => {
  it("accepts a minimal valid request and defaults description to empty", () => {
    const result = createFlagRequestSchema.safeParse({
      projectId: "project-1",
      key: "dark-mode",
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.description).toBe("");
  });

  it("rejects a request missing projectId", () => {
    expect(
      createFlagRequestSchema.safeParse({ key: "dark-mode" }).success,
    ).toBe(false);
  });

  it("rejects an over-long description", () => {
    expect(
      createFlagRequestSchema.safeParse({
        projectId: "p1",
        key: "k",
        description: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("does NOT enforce the flag-key format — that's the value object's job", () => {
    // Shape-only at the edge (balanced validation): "Dark Mode" passes Zod but the
    // FlagKey VO will reject it downstream.
    expect(
      createFlagRequestSchema.safeParse({ projectId: "p1", key: "Dark Mode" })
        .success,
    ).toBe(true);
  });
});

describe("updateFlagRulesRequestSchema", () => {
  it("accepts rules and an in-range rollout", () => {
    expect(
      updateFlagRulesRequestSchema.safeParse({
        targetingRules: [
          { type: "user-id-list", userIds: ["u1", "u2"], value: true },
        ],
        rolloutPercentage: 25,
      }).success,
    ).toBe(true);
  });

  it("rejects a rollout outside 0–100", () => {
    expect(
      updateFlagRulesRequestSchema.safeParse({
        targetingRules: [],
        rolloutPercentage: 150,
      }).success,
    ).toBe(false);
  });

  it("rejects a non-integer rollout", () => {
    expect(
      updateFlagRulesRequestSchema.safeParse({
        targetingRules: [],
        rolloutPercentage: 12.5,
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown targeting rule type", () => {
    expect(
      updateFlagRulesRequestSchema.safeParse({
        targetingRules: [{ type: "geo", value: true }],
        rolloutPercentage: 0,
      }).success,
    ).toBe(false);
  });
});

describe("targetingRuleSchema", () => {
  it("rejects a user-id-list rule with no ids", () => {
    expect(
      targetingRuleSchema.safeParse({
        type: "user-id-list",
        userIds: [],
        value: true,
      }).success,
    ).toBe(false);
  });
});

describe("evaluateFlagRequestSchema", () => {
  it("accepts a context with just a key", () => {
    expect(
      evaluateFlagRequestSchema.safeParse({ context: { key: "user-1" } })
        .success,
    ).toBe(true);
  });

  it("accepts a context with typed attributes", () => {
    expect(
      evaluateFlagRequestSchema.safeParse({
        context: { key: "user-1", attributes: { plan: "pro", seats: 5 } },
      }).success,
    ).toBe(true);
  });

  it("rejects a context with no key", () => {
    expect(evaluateFlagRequestSchema.safeParse({ context: {} }).success).toBe(
      false,
    );
  });
});
