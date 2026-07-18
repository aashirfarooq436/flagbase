import { describe, expect, it } from "vitest";

import { changeMemberRoleRequestSchema } from "./request";

describe("changeMemberRoleRequestSchema", () => {
  it("accepts admin and member", () => {
    expect(changeMemberRoleRequestSchema.safeParse({ role: "admin" }).success).toBe(true);
    expect(changeMemberRoleRequestSchema.safeParse({ role: "member" }).success).toBe(true);
  });

  it("rejects owner — ownership is transferred, not assigned", () => {
    expect(changeMemberRoleRequestSchema.safeParse({ role: "owner" }).success).toBe(false);
  });

  it("rejects an unknown role", () => {
    expect(changeMemberRoleRequestSchema.safeParse({ role: "superuser" }).success).toBe(false);
  });
});
