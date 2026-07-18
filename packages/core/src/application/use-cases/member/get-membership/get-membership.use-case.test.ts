import { describe, expect, it } from "vitest";

import { Member } from "../../../../domain/member/member.entity";
import { Role } from "../../../../domain/member/role";
import { InMemoryMemberRepository } from "../../../../lib/test-support/in-memory-member.repository";
import { GetMembershipUseCase } from "./get-membership.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function member(id: string, organizationId: string, userId: string): Member {
  return Member.create({
    id,
    organizationId,
    userId,
    role: Role.Admin,
    now: NOW,
  });
}

describe("GetMembershipUseCase", () => {
  it("returns the membership for a member of the org", async () => {
    const members = new InMemoryMemberRepository([
      member("m-1", "org-1", "user-1"),
    ]);
    const useCase = new GetMembershipUseCase(members);

    const found = await useCase.execute({
      organizationId: "org-1",
      userId: "user-1",
    });

    expect(found?.role).toBe(Role.Admin);
  });

  it("returns null when the user is not a member of the org", async () => {
    const members = new InMemoryMemberRepository([
      member("m-1", "org-1", "user-1"),
    ]);
    const useCase = new GetMembershipUseCase(members);

    expect(
      await useCase.execute({ organizationId: "org-2", userId: "user-1" }),
    ).toBeNull();
  });
});
