import { describe, expect, it } from "vitest";

import { Member } from "../../../../domain/member/member.entity";
import { Organization } from "../../../../domain/organization/organization.entity";
import { Role } from "../../../../domain/member/role";
import { InMemoryMemberRepository } from "../../../../lib/test-support/in-memory-member.repository";
import { InMemoryOrganizationRepository } from "../../../../lib/test-support/in-memory-organization.repository";
import { ListMyOrganizationsUseCase } from "./list-my-organizations.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function membership(
  id: string,
  organizationId: string,
  userId: string,
): Member {
  return Member.create({
    id,
    organizationId,
    userId,
    role: Role.Member,
    now: NOW,
  });
}

function setup() {
  const members = new InMemoryMemberRepository([
    membership("m-1", "org-1", "user-1"),
    membership("m-2", "org-2", "user-1"),
    membership("m-3", "org-3", "user-2"),
  ]);
  const organizations = new InMemoryOrganizationRepository([
    Organization.create({ id: "org-1", name: "Acme", now: NOW }),
    Organization.create({ id: "org-2", name: "Globex", now: NOW }),
    Organization.create({ id: "org-3", name: "Initech", now: NOW }),
  ]);
  return { useCase: new ListMyOrganizationsUseCase(members, organizations) };
}

describe("ListMyOrganizationsUseCase", () => {
  it("returns the organizations the user belongs to", async () => {
    const { useCase } = setup();
    const orgs = await useCase.execute({ userId: "user-1" });

    expect(orgs.map((o) => o.name).sort()).toEqual(["Acme", "Globex"]);
  });

  it("returns an empty list for a user in no organizations", async () => {
    const { useCase } = setup();
    expect(await useCase.execute({ userId: "nobody" })).toEqual([]);
  });
});
