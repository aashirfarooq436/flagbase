import { describe, expect, it } from "vitest";

import { Member } from "./member.entity";
import { Role } from "./role.vo";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function makeMember(role: Role): Member {
  return Member.create({
    id: "member-1",
    organizationId: "org-1",
    userId: "user-1",
    role,
    now: NOW,
  });
}

describe("Member", () => {
  it("creates with a role", () => {
    const member = makeMember(Role.Admin);
    expect(member.role).toBe(Role.Admin);
    expect(member.organizationId).toBe("org-1");
    expect(member.userId).toBe("user-1");
  });

  describe("isOwner", () => {
    it("is true only for the Owner role", () => {
      expect(makeMember(Role.Owner).isOwner).toBe(true);
      expect(makeMember(Role.Admin).isOwner).toBe(false);
      expect(makeMember(Role.Member).isOwner).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("grants an owner org management", () => {
      expect(makeMember(Role.Owner).hasPermission("organization:manage")).toBe(
        true,
      );
    });

    it("denies an admin org management", () => {
      expect(makeMember(Role.Admin).hasPermission("organization:manage")).toBe(
        false,
      );
    });

    it("grants an admin flag management but only read access to members", () => {
      const admin = makeMember(Role.Admin);
      expect(admin.hasPermission("flag:manage")).toBe(true);
      expect(admin.hasPermission("member:read")).toBe(true);
      expect(admin.hasPermission("member:manage")).toBe(false);
    });

    it("limits a plain member to read access", () => {
      const member = makeMember(Role.Member);
      expect(member.hasPermission("flag:read")).toBe(true);
      expect(member.hasPermission("flag:manage")).toBe(false);
    });
  });

  it("changes role", () => {
    const member = makeMember(Role.Member);
    member.changeRole(Role.Admin);
    expect(member.role).toBe(Role.Admin);
  });
});
