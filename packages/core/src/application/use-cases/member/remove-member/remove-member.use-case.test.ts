import { describe, expect, it } from "vitest";

import { Member } from "../../../../domain/member/member.entity";
import { Role } from "../../../../domain/member/role";
import { InMemoryMemberRepository } from "../../../../lib/test-support/in-memory-member.repository";
import { ForbiddenError, NotFoundError } from "../../../../shared/errors";
import { RemoveMemberUseCase } from "./remove-member.use-case";

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
  return { useCase: new RemoveMemberUseCase(members), members };
}

describe("RemoveMemberUseCase", () => {
  it("removes a member", async () => {
    const { useCase, members } = setup([member("m-1", Role.Member)]);

    await useCase.execute({ organizationId: "org-1", memberId: "m-1" });

    expect(await members.findById("m-1")).toBeNull();
  });

  it("throws NotFoundError for an unknown member", async () => {
    const { useCase } = setup([]);
    await expect(
      useCase.execute({ organizationId: "org-1", memberId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the member is in another organization", async () => {
    const { useCase } = setup([member("m-1", Role.Member, "org-2")]);
    await expect(
      useCase.execute({ organizationId: "org-1", memberId: "m-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses to remove the owner", async () => {
    const { useCase } = setup([member("m-1", Role.Owner)]);
    await expect(
      useCase.execute({ organizationId: "org-1", memberId: "m-1" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
