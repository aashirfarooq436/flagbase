import { describe, expect, it } from "vitest";

import { ROLE_PERMISSIONS, Role, roleHasPermission } from "./role.vo";

describe("Role permissions", () => {
  it("gives Owner the widest authority", () => {
    expect(roleHasPermission(Role.Owner, "organization:manage")).toBe(true);
    expect(roleHasPermission(Role.Owner, "member:manage")).toBe(true);
  });

  it("descends in authority Owner > Admin > Member", () => {
    expect(ROLE_PERMISSIONS[Role.Owner].length).toBeGreaterThan(
      ROLE_PERMISSIONS[Role.Admin].length,
    );
    expect(ROLE_PERMISSIONS[Role.Admin].length).toBeGreaterThan(
      ROLE_PERMISSIONS[Role.Member].length,
    );
  });

  it("never grants a plain member any manage permission", () => {
    for (const permission of ROLE_PERMISSIONS[Role.Member]) {
      expect(permission.endsWith(":manage")).toBe(false);
    }
  });

  it("returns false for a permission a role does not hold", () => {
    expect(roleHasPermission(Role.Member, "organization:manage")).toBe(false);
  });
});
