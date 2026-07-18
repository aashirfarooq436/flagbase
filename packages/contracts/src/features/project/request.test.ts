import { describe, expect, it } from "vitest";

import { createProjectRequestSchema } from "./request";

describe("createProjectRequestSchema", () => {
  it("accepts a valid name", () => {
    expect(createProjectRequestSchema.safeParse({ name: "API" }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(createProjectRequestSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
