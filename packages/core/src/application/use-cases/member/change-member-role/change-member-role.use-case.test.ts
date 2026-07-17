import { describe, expect, it } from "vitest";

import { Member } from "../../../../domain/member/member.entity";
import { Role } from "../../../../domain/member/role.vo";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import { InMemoryMemberRepository } from "../../../../lib/test-support/in-memory-member.repository";
import { ChangeMemberRoleUseCase } from "./change-member-role.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function member(id: string, role: Role, organizationId = "org-1"): Member {
  return Member.create({
    id,
    organizationId,
    userId: `user-${id}`,
    role,
    now: NOW,
  });
}

function setup(seed: Member[]) {
  const members = new InMemoryMemberRepository(seed);
  return { useCase: new ChangeMemberRoleUseCase(members), members };
}

describe("ChangeMemberRoleUseCase", () => {
  it("changes an admin to a member", async () => {
    const { useCase, members } = setup([member("m-1", Role.Admin)]);

    const updated = await useCase.execute({
      organizationId: "org-1",
      memberId: "m-1",
      newRole: Role.Member,
    });

    expect(updated.role).toBe(Role.Member);
    expect((await members.findById("m-1"))!.role).toBe(Role.Member);
  });

  it("throws NotFoundError for an unknown member", async () => {
    const { useCase } = setup([]);
    await expect(
      useCase.execute({
        organizationId: "org-1",
        memberId: "nope",
        newRole: Role.Admin,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the member is in another organization", async () => {
    const { useCase } = setup([member("m-1", Role.Member, "org-2")]);
    await expect(
      useCase.execute({
        organizationId: "org-1",
        memberId: "m-1",
        newRole: Role.Admin,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses to assign the Owner role", async () => {
    const { useCase } = setup([member("m-1", Role.Admin)]);
    await expect(
      useCase.execute({
        organizationId: "org-1",
        memberId: "m-1",
        newRole: Role.Owner,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses to change the current owner's role", async () => {
    const { useCase } = setup([member("m-1", Role.Owner)]);
    await expect(
      useCase.execute({
        organizationId: "org-1",
        memberId: "m-1",
        newRole: Role.Admin,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
