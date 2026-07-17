import { describe, expect, it } from "vitest";

import { Member } from "../../../../domain/member/member.entity";
import { Role } from "../../../../domain/member/role.vo";
import { InMemoryMemberRepository } from "../../../../lib/test-support/in-memory-member.repository";
import { ListMembersUseCase } from "./list-members.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function member(id: string, organizationId: string): Member {
  return Member.create({
    id,
    organizationId,
    userId: `user-${id}`,
    role: Role.Member,
    now: NOW,
  });
}

describe("ListMembersUseCase", () => {
  it("returns only the given organization's members", async () => {
    const members = new InMemoryMemberRepository([
      member("a", "org-1"),
      member("b", "org-1"),
      member("c", "org-2"),
    ]);
    const useCase = new ListMembersUseCase(members);

    expect(await useCase.execute({ organizationId: "org-1" })).toHaveLength(2);
  });
});
