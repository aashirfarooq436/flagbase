import { describe, expect, it } from "vitest";

import { createOrganizationRequestSchema } from "./request";

describe("createOrganizationRequestSchema", () => {
  it("accepts a valid name", () => {
    expect(
      createOrganizationRequestSchema.safeParse({ name: "Acme" }).success,
    ).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(
      createOrganizationRequestSchema.safeParse({ name: "" }).success,
    ).toBe(false);
  });

  it("rejects a name over the length limit", () => {
    expect(
      createOrganizationRequestSchema.safeParse({ name: "x".repeat(101) })
        .success,
    ).toBe(false);
  });
});
